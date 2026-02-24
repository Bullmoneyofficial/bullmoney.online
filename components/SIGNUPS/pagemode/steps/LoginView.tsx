"use client";

import React from "react";
import { AlertCircle, ChevronLeft, Eye, EyeOff } from "lucide-react";

type Props = {
  motion: any;
  iosInAppShieldStyle?: React.CSSProperties;

  loginEmail: string;
  onChangeEmail: (value: string) => void;
  loginPassword: string;
  onChangePassword: (value: string) => void;

  showPassword: boolean;
  onToggleShowPassword: () => void;

  submitError: string | null;

  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onToggleViewMode: () => void;

  STYLE_BACK_BTN: React.CSSProperties;
  STYLE_TOP_EDGE: React.CSSProperties;
  FONT_FAMILY_FULL: string;
};

export default function LoginView({
  motion,
  iosInAppShieldStyle,
  loginEmail,
  onChangeEmail,
  loginPassword,
  onChangePassword,
  showPassword,
  onToggleShowPassword,
  submitError,
  onSubmit,
  onBack,
  onToggleViewMode,
  STYLE_BACK_BTN,
  STYLE_TOP_EDGE,
  FONT_FAMILY_FULL,
}: Props) {
  return (
    <motion.div
      key="login-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
        onClick={onBack}
        className="btn-3d-secondary cursor-target"
        style={STYLE_BACK_BTN}
      >
        <ChevronLeft style={{ width: 16, height: 16 }} /> Back
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
          width: "100%",
          maxWidth: 384,
          marginLeft: 16,
          marginRight: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 32px -8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.04)",
          fontFamily: FONT_FAMILY_FULL,
          perspective: 1200,
          transformStyle: "preserve-3d" as any,
        }}
      >
        <div style={STYLE_TOP_EDGE} />

        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 12, position: "relative", zIndex: 10 }}
        >
          <img
            src="/IMG_2921.PNG"
            alt="BullMoney"
            className="icon-float"
            style={{
              width: 44,
              height: 44,
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))",
            }}
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: "#000", letterSpacing: "-0.02em" }}
        >
          Sign In
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 20, fontSize: 13, color: "rgba(0,0,0,0.45)", fontWeight: 400 }}
        >
          Welcome back to BullMoney
        </motion.p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 10 }} autoComplete="on">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <input
              autoFocus
              type="email"
              name="email"
              id="login-email"
              autoComplete="username"
              value={loginEmail}
              onChange={(e) => onChangeEmail(e.target.value)}
              placeholder="Email"
              className="apple-input"
              style={{
                width: "100%",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 14,
                padding: "14px 16px",
                color: "#000",
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "relative" }}
          >
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="login-password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => onChangePassword(e.target.value)}
              placeholder="Password"
              className="apple-input"
              style={{
                width: "100%",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 14,
                padding: "14px 16px",
                paddingRight: 44,
                color: "#000",
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              className="cursor-target"
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(0,0,0,0.25)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </motion.div>

          {submitError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#dc2626",
                fontSize: 12,
                backgroundColor: "#fef2f2",
                padding: 10,
                borderRadius: 12,
                border: "1px solid #fee2e2",
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> {submitError}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={!loginEmail || !loginPassword}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={loginEmail && loginPassword ? { scale: 1.02, y: -2 } : {}}
            whileTap={loginEmail && loginPassword ? { scale: 0.96, y: 1 } : {}}
            className="btn-3d-primary cursor-target"
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 14,
              fontWeight: 600,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: loginEmail && loginPassword ? "pointer" : "not-allowed",
              opacity: !loginEmail || !loginPassword ? 0.4 : 1,
              boxShadow: loginEmail && loginPassword ? "0 4px 20px -4px rgba(0,0,0,0.3)" : "none",
            }}
          >
            Sign In
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          style={{ marginTop: 16, textAlign: "center", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 16 }}
        >
          <button
            onClick={onToggleViewMode}
            className="btn-3d-secondary cursor-target"
            style={{
              fontSize: 13,
              color: "rgba(0,0,0,0.4)",
              fontWeight: 400,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 8,
            }}
          >
            Don&apos;t have an account? <span style={{ color: "#000", fontWeight: 500 }}>Create one</span>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
