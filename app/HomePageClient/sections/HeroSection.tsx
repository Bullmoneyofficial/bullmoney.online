"use client";

import type { CSSProperties } from "react";
import { HeroSkeleton } from "@/components/MobileLazyLoadingFallback";
import {
  HeroDesktop as DiscordDesktopHero,
  MetaTraderQuotes,
  Features,
  BullMoneyCommunity,
  BreakingNewsTicker,
  FooterComponent,
  TestimonialsCarousel,
  BrokerSignupSectionDark,
} from "@/components/home/dynamicImports";
import { DiscordMobileHero } from "../dynamicComponents";

// ============================================================
// HeroSection — Full #hero section JSX
//
// Encapsulates every content sub-section that lives inside the
// main #hero element: hero header, broker signups, community
// hub, market quotes, breaking news, features, testimonials
// and footer. All layout state is received via props so the
// parent orchestrator stays slim.
// ============================================================

export interface HeroSectionProps {
  isMobile: boolean;
  hasMounted: boolean;
  showStage2: boolean;
  showStage3: boolean;
  showStage4: boolean;
  canRenderMobileSections: boolean;
  featuredVideos: any[];
  deferredSectionStyle: CSSProperties;
  openDiscordStageModal: () => void;
}

export function HeroSection({
  isMobile,
  hasMounted,
  showStage2,
  showStage3,
  showStage4,
  canRenderMobileSections,
  featuredVideos,
  deferredSectionStyle,
  openDiscordStageModal,
}: HeroSectionProps) {
  return (
    <>
      {/* ── Scroll & overflow fix styles ─────────────────── */}
      <style>{`
        /* CRITICAL: Top-level scroll fix - MUST be first */
        html, body {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: auto !important;
          min-height: 100vh !important;
          touch-action: pan-y pan-x !important;
          position: relative !important;
          scroll-behavior: auto !important;
        }

        /* iOS-specific scroll fixes */
        @supports (-webkit-touch-callout: none) {
          html, body {
            -webkit-overflow-scrolling: touch !important;
          }
        }

        /* MOBILE FIX: Ensure scrolling works on mobile */
        @media (max-width: 767px) {
          body, html {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            touch-action: pan-y pan-x !important;
          }
        }

        /* DESKTOP FIX: Ensure scrolling works on desktop */
        @media (min-width: 768px) {
          body, html {
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          #hero {
            height: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
          }
        }

        #hero .cycling-bg-layer,
        #hero .cycling-bg-item,
        #hero .cycling-bg-item.active {
          pointer-events: none !important;
          touch-action: pan-y pan-x !important;
        }
        #hero .cycling-bg-layer canvas,
        #hero .cycling-bg-item canvas {
          pointer-events: auto !important;
        }
        #hero .hero-wrapper {
          overflow: visible !important;
          overflow-x: hidden !important;
          touch-action: pan-y pan-x !important;
        }
        #hero .hero-content-overlay {
          pointer-events: none;
          touch-action: pan-y pan-x !important;
        }
        #hero .hero-content-overlay > * {
          pointer-events: auto;
        }
      `}</style>

      {/* ── Hero section ─────────────────────────────────── */}
      <section
        id="hero"
        className={
          isMobile
            ? "w-full full-bleed flex flex-col overflow-x-hidden overflow-y-visible relative px-2 sm:px-4"
            : "w-full full-bleed flex flex-col overflow-x-hidden overflow-y-visible relative px-2 sm:px-4"
        }
        style={
          isMobile
            ? {
                minHeight: "auto",
                height: "auto",
                paddingTop: "calc(52px + env(safe-area-inset-top, 0px))",
                paddingBottom: "12px",
              }
            : {
                minHeight: "auto",
                height: "auto",
                paddingTop: "52px",
                paddingBottom: "40px",
              }
        }
        data-canvas-section="true"
        data-allow-scroll
        data-content
        data-theme-aware
      >
        {/* ── Hero header ─────────────────────────────── */}
        <div className={isMobile ? "flex-shrink-0" : "flex-shrink-0"}>
          {!hasMounted ? (
            <HeroSkeleton />
          ) : isMobile ? (
            canRenderMobileSections ? (
              <DiscordMobileHero
                sources={featuredVideos}
                onOpenModal={openDiscordStageModal}
                variant="mobile"
              />
            ) : (
              <HeroSkeleton />
            )
          ) : (
            <DiscordDesktopHero />
          )}
        </div>

        {/* ── Broker Signup (above community) ─────────── */}
        <div style={{ flexShrink: 0, marginTop: isMobile ? 24 : 48 }}>
          {hasMounted && showStage2 && <BrokerSignupSectionDark />}
        </div>

        {/* ── Community Signals ───────────────────────── */}
        <div
          data-apple-section-wrapper
          style={{
            flexShrink: 0,
            marginTop: isMobile ? 24 : 48,
            contentVisibility: "visible",
            contain: "none",
          }}
        >
          {hasMounted && showStage2 && (
            <div
              style={
                isMobile
                  ? {
                      width: "100%",
                      borderTop: "1px solid rgba(255,255,255,0.15)",
                      overflow: "hidden",
                      background: "#000000",
                    }
                  : {
                      margin: "0 auto",
                      width: "100%",
                      maxWidth: 1800,
                      borderRadius: 24,
                      border: "1px solid rgba(255,255,255,0.15)",
                      overflow: "hidden",
                      background:
                        "linear-gradient(180deg, rgba(7,7,7,0.98), rgba(0,0,0,1))",
                      boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
                    }
              }
            >
              {!isMobile && (
                <div
                  style={{
                    padding: "20px 24px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.28em",
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    Community Hub
                  </p>
                  <h2
                    style={{
                      marginTop: 8,
                      fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      color: "#fff",
                    }}
                  >
                    Community Signals
                  </h2>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      color: "rgba(255,255,255,0.7)",
                      maxWidth: 768,
                    }}
                  >
                    Connect with the BullMoney trading community and access
                    real-time signals and market insights.
                  </p>
                </div>
              )}

              <div
                style={{
                  height: isMobile
                    ? "min(50vh, 400px)"
                    : "min(60vh, 700px)",
                  minHeight: isMobile ? "280px" : "min(40vh, 480px)",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    touchAction: "pan-x",
                    overscrollBehaviorX: "contain",
                  }}
                >
                  <BullMoneyCommunity />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Market Quotes ────────────────────────────── */}
        <div
          data-apple-section-wrapper
          className={isMobile ? "flex-shrink-0 mt-6" : "flex-shrink-0 mt-12"}
        >
          {hasMounted && showStage2 && (
            <div style={deferredSectionStyle}>
              <div
                className={
                  isMobile
                    ? "w-full border-t border-white/15 overflow-hidden"
                    : "mx-auto w-full max-w-[1800px] rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden"
                }
                style={
                  isMobile
                    ? { background: "#000000" }
                    : {
                        background:
                          "linear-gradient(180deg, rgba(7,7,7,0.98), rgba(0,0,0,1))",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
                      }
                }
              >
                {!isMobile && (
                  <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-white/10">
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/55">
                      Live Market Data
                    </p>
                    <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
                      Market Quotes
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl">
                      Real-time quotes and market data to keep you informed on
                      price movements and trading opportunities.
                    </p>
                  </div>
                )}

                <div
                  style={{
                    height: isMobile ? "min(35vh, 280px)" : "min(50vh, 500px)",
                    minHeight: isMobile ? "200px" : "300px",
                    background: "#0a0a0a",
                  }}
                >
                  <div className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain">
                    <MetaTraderQuotes embedded />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Breaking News ─────────────────────────────── */}
        <div
          data-apple-section-wrapper
          className={isMobile ? "flex-shrink-0 mt-6" : "flex-shrink-0 mt-12"}
        >
          {hasMounted && showStage2 && (
            <div style={deferredSectionStyle}>
              <div
                className={
                  isMobile
                    ? "w-full border-t border-white/15 overflow-hidden"
                    : "mx-auto w-full max-w-[1800px] rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden"
                }
                style={
                  isMobile
                    ? { background: "#000000" }
                    : {
                        background:
                          "linear-gradient(180deg, rgba(7,7,7,0.98), rgba(0,0,0,1))",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
                      }
                }
              >
                {!isMobile && (
                  <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-white/10">
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/55">
                      Market News
                    </p>
                    <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
                      Breaking News
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl">
                      Stay updated with the latest market-moving news and
                      financial headlines from around the world.
                    </p>
                  </div>
                )}

                <div style={{ background: "#000000" }}>
                  <div className="w-full">
                    <BreakingNewsTicker />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Features ──────────────────────────────────── */}
        <div
          data-apple-section-wrapper
          className={isMobile ? "flex-shrink-0 mt-6" : "flex-shrink-0 mt-12"}
        >
          {hasMounted && showStage2 && (
            <div style={deferredSectionStyle}>
              <Features />
            </div>
          )}
        </div>

        {/* ── Testimonials ──────────────────────────────── */}
        <div
          className={isMobile ? "flex-shrink-0 mt-6" : "flex-shrink-0 mt-12"}
        >
          {hasMounted && showStage3 && (
            <div style={deferredSectionStyle}>
              <TestimonialsCarousel />
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div
          className={isMobile ? "flex-shrink-0 mt-8" : "flex-shrink-0 mt-16"}
        >
          {hasMounted && showStage4 && (
            <div style={deferredSectionStyle}>
              <FooterComponent />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
