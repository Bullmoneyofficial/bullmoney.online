"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import type { HubPanelProps, HubPillProps } from "../types";

type Props = {
  motion: any;
  onBack: () => void;
  onContinue: () => void;
  SafePortal: React.ComponentType<{ children: React.ReactNode }>;
  UnifiedFpsPillComp: React.ComponentType<HubPillProps> | null;
  UnifiedHubPanelComp: React.ComponentType<HubPanelProps> | null;
  isHubOpen: boolean;
  closeHubPanel: () => void;
  isHubMinimized: boolean;
  toggleHubMinimized: () => void;
  openHubPanel: () => void;
  prices: any;
  UI_Z_INDEX: { PAGEMODE: number };
  iosInAppShieldStyle?: React.CSSProperties;
  FONT_FAMILY_SHORT: string;
  FONT_FAMILY_FULL: string;
};

export function WelcomeStepGuest({
  motion,
  onBack,
  onContinue,
  SafePortal,
  UnifiedFpsPillComp,
  UnifiedHubPanelComp,
  isHubOpen,
  closeHubPanel,
  isHubMinimized,
  toggleHubMinimized,
  openHubPanel,
  prices,
  UI_Z_INDEX,
  iosInAppShieldStyle,
  FONT_FAMILY_SHORT,
  FONT_FAMILY_FULL,
}: Props) {
  return (
    <>
      <motion.div
        key="guest-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed inset-0 flex flex-col"
        style={{
          minHeight: "100dvh",
          height: "calc(var(--pagemode-vh, 1vh) * 100)",
          pointerEvents: "none",
          zIndex: UI_Z_INDEX.PAGEMODE,
          backgroundColor: "transparent",
          color: "#000",
          ...(iosInAppShieldStyle ?? {}),
        }}
      >
        <button
          onClick={onBack}
          className="apple-button cursor-target"
          style={{
            position: "fixed",
            top: 20,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "rgba(0,0,0,0.5)",
            fontSize: 13,
            fontWeight: 500,
            padding: "8px 12px",
            borderRadius: 12,
            zIndex: 50,
            backgroundColor: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "relative",
            zIndex: 10,
            paddingTop: 56,
            paddingBottom: 24,
            textAlign: "center",
            pointerEvents: "none",
            fontFamily: FONT_FAMILY_SHORT,
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#000", letterSpacing: "-0.03em" }}>BullMoney</h1>
        </motion.div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            width: "100%",
            paddingBottom: 40,
            position: "relative",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="apple-card"
            style={{
              borderRadius: 16,
              padding: 24,
              textAlign: "center",
              width: "100%",
              maxWidth: 320,
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              background: "#fff",
              fontFamily: FONT_FAMILY_FULL,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}
            >
              <img
                src="/IMG_2921.PNG"
                alt="BullMoney"
                className="icon-float"
                style={{ width: 44, height: 44, objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}
              />
            </motion.div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#000", marginBottom: 4, letterSpacing: "-0.02em" }}>Guest Access</h2>
            <p style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", marginBottom: 20, lineHeight: 1.6, fontWeight: 400 }}>
              Browse freely. Some features are limited.
            </p>
            <motion.button
              onClick={onContinue}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.96, y: 1 }}
              className="btn-3d-primary"
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 14,
                fontWeight: 600,
                fontSize: 15,
                background: "#fff",
                color: "#000",
                border: "1px solid rgba(0,0,0,0.15)",
                cursor: "pointer",
                boxShadow: "0 4px 20px -4px rgba(0,0,0,0.12)",
              }}
            >
              Continue
            </motion.button>
          </motion.div>
        </div>

        {UnifiedFpsPillComp && (
          <UnifiedFpsPillComp
            fps={60}
            deviceTier="high"
            prices={prices}
            isMinimized={isHubMinimized}
            onToggleMinimized={toggleHubMinimized}
            onOpenPanel={openHubPanel}
            topOffsetMobile="calc(env(safe-area-inset-top, 0px) + 100px)"
            topOffsetDesktop="calc(env(safe-area-inset-top, 0px) + 110px)"
            mobileAlignment="left"
          />
        )}
      </motion.div>

      <SafePortal>
        {UnifiedHubPanelComp && (
          <UnifiedHubPanelComp
            isOpen={isHubOpen}
            onClose={closeHubPanel}
            fps={60}
            deviceTier="high"
            isAdmin={false}
            isVip={false}
            userId={undefined}
            userEmail={undefined}
            prices={prices}
          />
        )}
      </SafePortal>
    </>
  );
}
