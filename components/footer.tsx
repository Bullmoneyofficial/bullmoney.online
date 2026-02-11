"use client";
import React, { useEffect, useCallback } from "react";
import { Logo } from "./logo";
import { DesktopFooter } from "./footer/DesktopFooter";
import { SocialsRow } from "./footer/SocialsRow";
import dynamic from "next/dynamic";
const LegalDisclaimerModal = dynamic(
  () => import("@/components/Mainpage/footer/LegalDisclaimerModal").then((m) => ({ default: m.LegalDisclaimerModal })),
  { ssr: false, loading: () => null }
);
const AppsToolsModal = dynamic(
  () => import("@/components/footer/AppsToolsModal").then((m) => ({ default: m.AppsToolsModal })),
  { ssr: false, loading: () => null }
);
import { useFpsOptimizer } from "@/lib/FpsOptimizer";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { useFooterModalsUI } from "@/contexts/UIStateContext";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";

// Neon Blue Sign Style from Chartnews (STATIC for performance)
const NEON_STYLES = `
  .neon-blue-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }

  .neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }

  .neon-white-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-border {
    border: 2px solid #ffffff;
    box-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px #ffffff;
  }

  .neon-blue-bg {
    background: #ffffff;
    box-shadow: 0 0 8px #ffffff, 0 0 16px #ffffff;
  }

  .gpu-layer {
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
`;

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Unified performance (Mobile + Desktop Lite Mode)
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();

  // FPS Optimizer integration for component lifecycle tracking
  const { registerComponent, unregisterComponent } = useFpsOptimizer();
  
  // Register component with FPS optimizer on mount
  useEffect(() => {
    registerComponent('footer');
    return () => unregisterComponent('footer');
  }, [registerComponent, unregisterComponent]);

  // Use centralized UI state for mutual exclusion with other modals
  const { isAppsOpen, isDisclaimerOpen, setAppsOpen, setDisclaimerOpen } = useFooterModalsUI();

  const handleDisclaimerClick = useCallback(() => {
    SoundEffects.click();
    setDisclaimerOpen(true);
  }, [setDisclaimerOpen]);

  const handleAppsClick = useCallback(() => {
    SoundEffects.click();
    setAppsOpen(true);
  }, [setAppsOpen]);

  return (
    <>
      {/* Only inject neon styles on desktop for performance */}
      {!shouldSkipHeavyEffects && <style dangerouslySetInnerHTML={{ __html: NEON_STYLES }} />}
      {/* Legal Disclaimer Modal - Comprehensive Terms, Privacy & Disclaimer */}
      {isDisclaimerOpen && (
        <LegalDisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
      )}

      {isAppsOpen && (
        <AppsToolsModal
          isOpen={isAppsOpen}
          onClose={() => setAppsOpen(false)}
        />
      )}

      <div
        className="relative w-full px-4 sm:px-8 py-8 sm:py-10 overflow-hidden"
      >
        {/* Inner Content Container - Static Neon Style on desktop, simplified on mobile */}
        <div 
          className={`relative max-w-7xl mx-auto flex flex-col items-center gap-6 sm:gap-8 bg-black rounded-2xl p-4 sm:p-6 ${shouldSkipHeavyEffects ? 'border border-white/50' : 'neon-blue-border'}`}
        >
          {/* Top: Logo */}
          <div className="scale-110 sm:scale-125 md:scale-150 origin-center p-1">
            <Logo />
          </div>

          {/* Desktop Footer Items */}
          <DesktopFooter
            onDisclaimerClick={handleDisclaimerClick}
            onAppsAndToolsClick={handleAppsClick}
            onSocialsClick={() => {}}
          />

          {/* Mobile Footer Items */}
          <div className="lg:hidden flex flex-wrap justify-center gap-2 sm:gap-3">
            <button
              onClick={handleDisclaimerClick}
              className={`px-4 py-2 text-sm font-medium bg-black rounded-full transition-all hover:brightness-110 active:scale-95 ${shouldSkipHeavyEffects ? 'border border-white/50 text-white' : 'neon-blue-border neon-blue-text'}`}
            >
              Disclaimer
            </button>
            <button
              onClick={handleAppsClick}
              className={`px-4 py-2 text-sm font-medium bg-black rounded-full transition-all hover:brightness-110 active:scale-95 ${shouldSkipHeavyEffects ? 'border border-white/50 text-white' : 'neon-blue-border neon-blue-text'}`}
            >
              Apps & Tools
            </button>
          </div>

          {/* Bottom: Socials Row */}
          <div className="mt-2 sm:mt-4">
            <SocialsRow />
          </div>

          {/* Copyright - Neon White Text on desktop, regular on mobile */}
          <p 
            className="text-[10px] sm:text-xs font-light tracking-wide text-center mt-4 sm:mt-6"
            style={{
              color: '#ffffff',
              textShadow: shouldSkipHeavyEffects ? 'none' : '0 0 4px #ffffff, 0 0 8px rgba(255, 255, 255, 0.5)'
            }}
          >
            &copy; {currentYear} BullMoney. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
