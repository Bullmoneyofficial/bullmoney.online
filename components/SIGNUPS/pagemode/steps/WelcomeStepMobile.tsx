"use client";

import React from "react";
import type { HubPanelProps, HubPillProps } from "../types";

type Props = {
  motion: any;
  onLogin: () => void;
  onSignUp: () => void;
  onGuest: () => void;
  onOpenLegal: (tab: "terms" | "privacy") => void;
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
  FONT_FAMILY_SHORT: string;
  FONT_FAMILY_FULL: string;
};

export function WelcomeStepMobile({
  motion,
  onLogin,
  onSignUp,
  onGuest,
  onOpenLegal,
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
  FONT_FAMILY_SHORT,
  FONT_FAMILY_FULL,
}: Props) {
  return (
    <>
      <motion.div
        key="welcome-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 flex flex-col"
        style={{
          minHeight: "100dvh",
          width: "100vw",
          height: "calc(var(--pagemode-vh, 1vh) * 100)",
          pointerEvents: "none",
          zIndex: UI_Z_INDEX.PAGEMODE,
          backgroundColor: "transparent",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", zIndex: 10, paddingTop: 40, paddingBottom: 20, textAlign: "center", pointerEvents: "none" }}
        >
          <motion.h1
            style={{
              position: "relative",
              fontSize: "clamp(1.8rem,6vw,2.4rem)",
              fontWeight: 600,
              color: "#fff",
              textShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
              letterSpacing: "-0.03em",
              fontFamily: FONT_FAMILY_SHORT,
            }}
          >
            BullMoney
          </motion.h1>
        </motion.div>

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            width: "100%",
            paddingBottom: 24,
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="apple-card"
            style={{
              width: "100%",
              maxWidth: 208,
              borderRadius: 12,
              padding: 16,
              background: "#fff",
              boxShadow: "0 1px 12px rgba(0, 0, 0, 0.06)",
              border: "1px solid rgba(0,0,0,0.08)",
              fontFamily: FONT_FAMILY_FULL,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}
            >
              <img
                src="/IMG_2921.PNG"
                alt="BullMoney"
                className="icon-float"
                style={{ width: 36, height: 36, objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}
              />
            </motion.div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 2, textAlign: "center", letterSpacing: "-0.02em" }}>
              BullMoney
            </h2>
            <p style={{ color: "rgba(0,0,0,0.4)", fontSize: 10, marginBottom: 16, textAlign: "center", fontWeight: 400 }}>
              Free trading tools & community
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <motion.button
                onClick={onLogin}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="btn-3d-primary"
                style={{ width: "100%", padding: "8px 0", borderRadius: 10, fontWeight: 600, fontSize: 11, background: "#000", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 3px 12px -3px rgba(0,0,0,0.3)" }}
              >
                Sign In
              </motion.button>

              <motion.button
                onClick={onSignUp}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="btn-3d-secondary"
                style={{ width: "100%", padding: "8px 0", borderRadius: 10, fontWeight: 600, fontSize: 11, color: "#000", backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer" }}
              >
                Create Account
              </motion.button>

              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}>
                <div style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
                <span style={{ color: "rgba(0,0,0,0.25)", fontSize: 9, fontWeight: 400 }}>or</span>
                <div style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
              </div>

              <motion.button
                onClick={onGuest}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: "100%", padding: "6px 0", borderRadius: 10, fontWeight: 400, fontSize: 10, color: "rgba(0,0,0,0.5)", backgroundColor: "rgba(0,0,0,0.03)", border: "none", cursor: "pointer", transition: "all 0.2s ease" }}
              >
                Browse as Guest
              </motion.button>
            </div>

            <p style={{ textAlign: "center", color: "rgba(0,0,0,0.25)", fontSize: 9, marginTop: 12, fontWeight: 400, lineHeight: 1.6 }}>
              By continuing, you agree to our{" "}
              <button
                type="button"
                onClick={() => onOpenLegal("terms")}
                style={{ color: "rgba(0,0,0,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 9 }}
              >
                Terms
              </button>
              {" & "}
              <button
                type="button"
                onClick={() => onOpenLegal("privacy")}
                style={{ color: "rgba(0,0,0,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 9 }}
              >
                Privacy
              </button>
            </p>
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
            mobileAlignment="center"
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
