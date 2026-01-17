"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { trackClick } from "@/lib/analytics";
import { SparklesCore } from "./sparkles";
import { Logo } from "./logo";
import FooterStyles from "./footer/FooterStyles";
import { SocialsRow } from "./footer/Socials";
import { FooterButton } from "./footer/FooterButton";
import { AppsModal } from "./footer/AppsModal";
import { LegalDisclaimerModal } from "./footer/LegalDisclaimerModal";
import { useFooterModalsUI } from "@/contexts/UIStateContext";

export function Footer() {
  // Use centralized UI state for mutual exclusion with other modals
  const { isAppsOpen, isDisclaimerOpen, setAppsOpen, setDisclaimerOpen } = useFooterModalsUI();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <>
      <FooterStyles />

      <footer id="footer" className="relative w-full overflow-hidden" data-allow-scroll style={{ touchAction: "pan-y" }}>
        <div className="relative group">
          <span className="absolute inset-[-2px] shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#60a5fa_50%,#3b82f6_75%,#00000000_100%)] opacity-50 rounded-t-2xl sm:rounded-t-3xl" />

          <div className="relative bg-black border-t-2 border-blue-500/40 hover:border-blue-400/60 transition-all duration-500 rounded-t-2xl sm:rounded-t-3xl">
            <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
              <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500 to-transparent shimmer-line shimmer-gpu" />
            </div>

            <div className="absolute inset-x-0 top-0 h-32 sm:h-40 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl" />

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)] pointer-events-none" />

            {isMounted && (
              <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-30">
                <SparklesCore
                  id="tsparticlesfooter"
                  background="transparent"
                  minSize={0.3}
                  maxSize={0.8}
                  particleDensity={30}
                  className="w-full h-full"
                  particleColor="#3b82f6"
                />
              </div>
            )}

            <div
              className="max-w-7xl mx-auto relative z-10 flex flex-col gap-6 sm:gap-8 pt-8 sm:pt-12 pb-6 sm:pb-8 px-3 sm:px-4 md:px-6"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <div className="relative w-full pb-6 sm:pb-8 border-b border-blue-500/20">
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-neutral-900/80 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.08)]">
                  <div className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl">
                    <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent shimmer-line shimmer-gpu" style={{ animationDuration: "4s" }} />
                  </div>

                  <p className="relative text-center text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-bold text-blue-400 mb-4 sm:mb-6 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    Join the Community
                  </p>
                  <SocialsRow />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6 lg:gap-8">
                <div className="relative w-full lg:w-auto flex flex-col items-center lg:items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-neutral-900/80 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 shimmer-pulse pointer-events-none" />

                  <div className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl">
                    <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/5 to-transparent shimmer-line shimmer-gpu" style={{ animationDuration: "5s" }} />
                  </div>

                  <div className="relative">
                    <Logo />
                  </div>
                  <div className="relative text-neutral-400 text-[10px] sm:text-xs text-center lg:text-left font-medium">
                    &copy; {new Date().getFullYear()} BullMoney. All rights reserved.
                  </div>
                </div>

                <div className="relative w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-900/80 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 shadow-[0_0_25px_rgba(59,130,246,0.08)] overflow-hidden">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/8 to-transparent shimmer-line shimmer-gpu" style={{ animationDuration: "5s" }} />
                  </div>

                  <FooterButton onClick={() => { trackClick('apps_tools_button', { source: 'footer' }); setAppsOpen(true); }} variant="primary" icon={<ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}>
                    Apps & Tools
                  </FooterButton>

                  <FooterButton onClick={() => { trackClick('legal_disclaimer_button', { source: 'footer' }); setDisclaimerOpen(true); }} icon={<ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}>
                    Legal Disclaimer
                  </FooterButton>
                </div>
              </div>

              <div className="relative text-center pt-4 sm:pt-6 border-t border-blue-500/20">
                <div className="relative inline-block p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-neutral-900/60 overflow-hidden">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-blue-500/5 to-transparent" />

                  <p className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-tight">
                    <span className="relative inline-block">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-white bg-[length:200%_100%] drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" style={{ animation: "shimmer-line shimmer-gpu 3s linear infinite", backgroundPosition: "0% 0%" }}>
                        Bull Money
                      </span>
                    </span>
                  </p>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-blue-400/70 mt-2 sm:mt-3 font-bold">
                    Elite Trading Community
                  </p>

                  <div className="flex justify-center gap-1 sm:gap-1.5 mt-3 sm:mt-4">
                    <span className="w-1 h-1 rounded-full bg-blue-500/60 shimmer-dot-pulse" />
                    <span className="w-1 h-1 rounded-full bg-blue-400/80 shimmer-dot-pulse" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1 h-1 rounded-full bg-blue-500/60 shimmer-dot-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AppsModal isOpen={isAppsOpen} onClose={() => setAppsOpen(false)} />
      <LegalDisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
    </>
  );
}
