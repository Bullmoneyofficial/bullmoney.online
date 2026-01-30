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

// Neon Blue Sign Styles (Static glow like Chartnews)
const NEON_STYLES = `
  .neon-blue-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, 0 0 12px #ffffff;
  }
  .neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }
  .neon-blue-border {
    border: 2px solid #ffffff;
    box-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px rgba(255, 255, 255, 0.3);
  }
  .neon-blue-border-light {
    border: 1px solid #ffffff;
    box-shadow: 0 0 3px #ffffff, 0 0 6px #ffffff;
  }
  .neon-glow-bg {
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.4), 0 0 30px rgba(255, 255, 255, 0.2);
  }
`;

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
      <style dangerouslySetInnerHTML={{ __html: NEON_STYLES }} />

      <footer id="footer" className="relative w-full overflow-hidden" data-allow-scroll style={{ touchAction: "pan-y" }}>
        <div className="relative group">
          {/* Static neon border glow */}
          <span className="absolute inset-[-2px] rounded-t-2xl sm:rounded-t-3xl neon-blue-border" style={{ background: 'transparent' }} />

          <div className="relative bg-black neon-blue-border rounded-t-2xl sm:rounded-t-3xl">

            <div
              className="max-w-7xl mx-auto relative z-10 flex flex-col gap-6 sm:gap-8 pt-8 sm:pt-12 pb-6 sm:pb-8 px-3 sm:px-4 md:px-6"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
            >
              {/* Join the Community Section - Neon styled */}
              <div className="relative w-full pb-6 sm:pb-8" style={{ borderBottom: '1px solid #ffffff', boxShadow: '0 1px 0 0 rgba(255, 255, 255, 0.5)' }}>
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-black neon-blue-border-light neon-glow-bg">
                  <p className="relative text-center text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-bold neon-blue-text mb-4 sm:mb-6">
                    Join the Community
                  </p>
                  <SocialsRow />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6 lg:gap-8">
                {/* Logo & Copyright Section - Neon styled */}
                <div className="relative w-full lg:w-auto flex flex-col items-center lg:items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-black neon-blue-border-light neon-glow-bg overflow-hidden">
                  <div className="relative">
                    <Logo />
                  </div>
                  <div className="relative neon-white-text text-[10px] sm:text-xs text-center lg:text-left font-medium">
                    &copy; {new Date().getFullYear()} BullMoney. All rights reserved.
                  </div>
                </div>

                {/* Buttons Section - Neon styled */}
                <div className="relative w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black neon-blue-border-light neon-glow-bg overflow-hidden">
                  <FooterButton onClick={() => { trackClick('apps_tools_button', { source: 'footer' }); setAppsOpen(true); }} variant="primary" icon={<ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}>
                    Apps & Tools
                  </FooterButton>

                  <FooterButton onClick={() => { trackClick('legal_disclaimer_button', { source: 'footer' }); setDisclaimerOpen(true); }} icon={<ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}>
                    Legal Disclaimer
                  </FooterButton>
                </div>
              </div>

              {/* Elite Trading Community Section - Neon styled */}
              <div className="relative text-center pt-4 sm:pt-6" style={{ borderTop: '1px solid #ffffff', boxShadow: '0 -1px 0 0 rgba(255, 255, 255, 0.5)' }}>
                <div className="relative inline-block p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-black neon-blue-border-light neon-glow-bg overflow-hidden">
                  <p className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-tight">
                    <span className="relative inline-block">
                      <span className="neon-white-text">
                        Bull Money
                      </span>
                    </span>
                  </p>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] neon-blue-text mt-2 sm:mt-3 font-bold">
                    Elite Trading Community
                  </p>

                  {/* Static neon dots */}
                  <div className="flex justify-center gap-1 sm:gap-1.5 mt-3 sm:mt-4">
                    <span className="w-1 h-1 rounded-full bg-white" style={{ boxShadow: '0 0 4px #ffffff, 0 0 8px #ffffff' }} />
                    <span className="w-1 h-1 rounded-full bg-white" style={{ boxShadow: '0 0 4px #ffffff, 0 0 8px #ffffff' }} />
                    <span className="w-1 h-1 rounded-full bg-white" style={{ boxShadow: '0 0 4px #ffffff, 0 0 8px #ffffff' }} />
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
