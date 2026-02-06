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
  const { isAppsOpen, isDisclaimerOpen, setAppsOpen, setDisclaimerOpen } = useFooterModalsUI();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <>
      <FooterStyles />

      <footer id="footer" className="relative w-full overflow-hidden bg-black" data-allow-scroll style={{ touchAction: "pan-y" }}>
        <div className="relative">
          {/* Minimal top border */}
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

          <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 md:px-8 pt-12 md:pt-16 pb-8 md:pb-12"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}>
            
            {/* Community Section - Clean and minimal */}
            <div className="mb-12 md:mb-16">
              <p className="text-center text-xs font-medium tracking-widest text-white/40 uppercase mb-6">
                Join the Community
              </p>
              <SocialsRow />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-12 md:mb-16">
              {/* Logo & Copyright */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <Logo />
                <p className="text-xs text-white/50 text-center lg:text-left">
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
                <p className="text-lg md:text-xl font-semibold text-white">
                  Bull Money
                </p>
                <p className="text-xs tracking-wider text-white/50 uppercase">
                  Elite Trading
                </p>
              </div>
            </div>

            {/* Bottom minimal divider */}
            <div className="pt-8 border-t border-white/10">
              <div className="flex justify-center gap-1">
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="w-1 h-1 rounded-full bg-white/30" />
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
