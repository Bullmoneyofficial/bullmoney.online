"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { trackClick } from "@/lib/analytics";
import { SparklesCore } from "./sparkles";
import { Logo } from "./logo";
import FooterStyles from "./footer/FooterStyles";
import { SocialsRow } from "./footer/Socials";
import { FooterButton } from "./footer/FooterButton";
import dynamic from "next/dynamic";
const AppsModal = dynamic(() => import("./footer/AppsModal").then((m) => ({ default: m.AppsModal })), { ssr: false, loading: () => null });
const LegalDisclaimerModal = dynamic(() => import("./footer/LegalDisclaimerModal").then((m) => ({ default: m.LegalDisclaimerModal })), { ssr: false, loading: () => null });
import { useFooterModalsUI } from "@/contexts/UIStateContext";

// Footer styles matching store header (white bg, black text)
const FOOTER_STYLES = `
  .footer-text {
    color: #000000;
  }
  .footer-text-muted {
    color: rgba(0, 0, 0, 0.5);
  }
  .footer-text-light {
    color: rgba(0, 0, 0, 0.4);
  }
  .footer-border {
    border-color: rgba(0, 0, 0, 0.1);
  }
  .footer-border-light {
    border-color: rgba(0, 0, 0, 0.06);
  }
`;

export function Footer() {
  const { isAppsOpen, isDisclaimerOpen, setAppsOpen, setDisclaimerOpen } = useFooterModalsUI();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <>
      <FooterStyles />
      <style>{FOOTER_STYLES}</style>

      <footer id="footer" className="relative w-full overflow-hidden bg-white" data-allow-scroll style={{ touchAction: "pan-y" }}>
        <div className="relative">
          {/* Minimal top border */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />

          <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 md:px-8 pt-12 md:pt-16 pb-8 md:pb-12"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}>
            
            {/* Community Section - Clean and minimal */}
            <div className="mb-12 md:mb-16">
              <p className="text-center text-xs font-medium tracking-widest footer-text-light uppercase mb-6">
                Join the Community
              </p>
              <SocialsRow />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-12 md:mb-16">
              {/* Logo & Copyright */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <Logo />
                <p className="text-xs footer-text-muted text-center lg:text-left">
                  &copy; {new Date().getFullYear()} BullMoney. All rights reserved.
                </p>
              </div>

              {/* Buttons - centered */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <FooterButton 
                  onClick={() => { trackClick('apps_tools_button', { source: 'footer' }); setAppsOpen(true); }} 
                  variant="primary" 
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  Apps & Tools
                </FooterButton>

                <FooterButton 
                  onClick={() => { trackClick('legal_disclaimer_button', { source: 'footer' }); setDisclaimerOpen(true); }} 
                  icon={<ShieldAlert className="w-4 h-4" />}
                >
                  Legal
                </FooterButton>
              </div>

              {/* Tagline */}
              <div className="flex flex-col items-center lg:items-end gap-2">
                <p className="text-lg md:text-xl font-semibold footer-text">
                  Bull Money
                </p>
                <p className="text-xs tracking-wider footer-text-muted uppercase">
                  Elite Trading
                </p>
              </div>
            </div>

            {/* Bottom minimal divider */}
            <div className="pt-8 footer-border-light border-t">
              <div className="flex justify-center gap-1">
                <span className="w-1 h-1 rounded-full bg-black/30" />
                <span className="w-1 h-1 rounded-full bg-black/30" />
                <span className="w-1 h-1 rounded-full bg-black/30" />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {isAppsOpen && <AppsModal isOpen={isAppsOpen} onClose={() => setAppsOpen(false)} />}
      {isDisclaimerOpen && (
        <LegalDisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
      )}
    </>
  );
}
