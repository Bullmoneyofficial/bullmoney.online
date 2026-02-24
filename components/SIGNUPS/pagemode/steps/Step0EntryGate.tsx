"use client";

import React from "react";
import { ArrowRight, ChevronLeft, Lock } from "lucide-react";

type Props = {
  motion: any;
  iosInAppShieldStyle?: React.CSSProperties;
  returnToAccountManager: boolean;
  onBackToWelcome: () => void;
  onBackToAccountManager: () => void;
  onGetStarted: () => void;
  onToggleViewMode: () => void;
  STYLE_BACK_BTN: React.CSSProperties;
  STYLE_TOP_EDGE: React.CSSProperties;
  FONT_FAMILY_FULL: string;
};

export default function Step0EntryGate({
  motion,
  iosInAppShieldStyle,
  returnToAccountManager,
  onBackToWelcome,
  onBackToAccountManager,
  onGetStarted,
  onToggleViewMode,
  STYLE_BACK_BTN,
  STYLE_TOP_EDGE,
  FONT_FAMILY_FULL,
}: Props) {
  return (
    <motion.div
      key="step0-apple"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        minHeight: "100dvh",
        height: "calc(var(--pagemode-vh, 1vh) * 100)",
        backgroundColor: "#fff",
        zIndex: 99999998,
        ...(iosInAppShieldStyle ?? {}),
      }}
    >
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => {
          if (returnToAccountManager) {
            onBackToAccountManager();
          } else {
            onBackToWelcome();
          }
        }}
        className="btn-3d-secondary cursor-target"
        style={STYLE_BACK_BTN}
      >
        <ChevronLeft style={{ width: 16, height: 16 }} /> {returnToAccountManager ? "Account Manager" : "Back"}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, rotateX: 10, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 20,
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
          width: "100%",
          maxWidth: 384,
          marginLeft: 16,
          marginRight: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 32px -8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.04)",
          zIndex: 1,
          fontFamily: FONT_FAMILY_FULL,
          perspective: 1200,
          transformStyle: "preserve-3d" as any,
        }}
      >
        <div style={STYLE_TOP_EDGE} />

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}
        >
          <img
            src="/IMG_2921.PNG"
            alt="BullMoney"
            style={{ width: 48, height: 48, objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))" }}
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: "#000", letterSpacing: "-0.02em" }}
        >
          Get Free Access
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 13, marginBottom: 20, color: "rgba(0,0,0,0.45)", fontWeight: 400 }}
        >
          3 steps · 2 minutes · No payment needed
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "relative",
            zIndex: 10,
            marginBottom: 20,
            backgroundColor: "rgba(0,0,0,0.02)",
            borderRadius: 14,
            padding: 14,
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { n: "1", text: "Open a free broker account" },
              { n: "2", text: "Enter your trading ID" },
              { n: "3", text: "Create your login" },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    backgroundColor: "#000",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  {s.n}
                </span>
                <span style={{ fontSize: 13, color: "rgba(0,0,0,0.6)" }}>{s.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.button
          onClick={onGetStarted}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.96, y: 1 }}
          className="btn-3d-primary cursor-target"
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            fontWeight: 600,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "#000",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px -4px rgba(0,0,0,0.3)",
          }}
        >
          Get Started <ArrowRight style={{ width: 16, height: 16 }} />
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 10 }}
        >
          <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>
            <Lock style={{ width: 12, height: 12, display: "inline", marginRight: 4, verticalAlign: "middle" }} />No credit card required
          </p>
          <button
            onClick={onToggleViewMode}
            className="btn-3d-secondary"
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: "rgba(0,0,0,0.4)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 8,
            }}
          >
            Already registered? <span style={{ color: "#000", fontWeight: 500 }}>Sign in</span>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
