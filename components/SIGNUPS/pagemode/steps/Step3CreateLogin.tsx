"use client";

import React from "react";
import { AlertCircle, Check, ChevronLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

type Props = {
  motion: any;
  StepCard: React.ComponentType<any>;
  getStepProps: (n: number) => any;
  isXM: boolean;
  disableBackdropBlur: boolean;
  formData: { email: string; password: string; referralCode: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  acceptedTerms: boolean;
  onToggleAcceptedTerms: () => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  referralAttribution: { affiliateCode: string; affiliateName: string; affiliateEmail: string };
  submitError: string | null;
  onNext: () => void;
  onBack: () => void;
  onOpenLegal: (tab: "terms" | "privacy" | "disclaimer") => void;
};

export default function Step3CreateLogin({
  motion,
  StepCard,
  getStepProps,
  isXM,
  disableBackdropBlur,
  formData,
  onChange,
  acceptedTerms,
  onToggleAcceptedTerms,
  showPassword,
  onToggleShowPassword,
  referralAttribution,
  submitError,
  onNext,
  onBack,
  onOpenLegal,
}: Props) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col items-center justify-center"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}
    >
      <StepCard
        {...getStepProps(3)}
        title="Create Your Login"
        className="register-card"
        isXM={isXM}
        disableEffects={true}
        disableBackdropBlur={disableBackdropBlur}
        actions={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <motion.button
              onClick={onNext}
              disabled={!formData.email || !formData.password || !acceptedTerms}
              whileHover={formData.email && formData.password && acceptedTerms ? { scale: 1.02, y: -2 } : {}}
              whileTap={formData.email && formData.password && acceptedTerms ? { scale: 0.96, y: 1 } : {}}
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
                gap: 8,
                background: "#000",
                color: "#fff",
                border: "none",
                cursor: formData.email && formData.password && acceptedTerms ? "pointer" : "not-allowed",
                opacity: !formData.email || !formData.password || !acceptedTerms ? 0.4 : 1,
                boxShadow: formData.email && formData.password && acceptedTerms ? "0 4px 20px -4px rgba(0,0,0,0.3)" : "none",
              }}
            >
              Finish &amp; Get Access <ShieldCheck style={{ width: 16, height: 16 }} />
            </motion.button>
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-target"
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 13,
                color: "rgba(0,0,0,0.4)",
                margin: "0 auto",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <ChevronLeft style={{ width: 14, height: 14, marginRight: 2 }} /> Back
            </motion.button>
          </div>
        }
      >
        <p style={{ fontSize: 13, marginBottom: 16, color: "rgba(0,0,0,0.45)", fontWeight: 400 }}>
          Last step — set up your email and password.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <input
              autoFocus
              type="email"
              name="email"
              autoComplete="username"
              value={formData.email}
              onChange={onChange}
              placeholder="Email address"
              className="apple-input cursor-target"
              style={{
                width: "100%",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 12,
                padding: "14px 16px",
                color: "#000",
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={onChange}
              placeholder="Password (min 6 characters)"
              className="apple-input cursor-target"
              style={{
                width: "100%",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 12,
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
          </div>

          <div style={{ position: "relative" }}>
            <input
              type="text"
              name="referralCode"
              value={formData.referralCode}
              onChange={onChange}
              placeholder="BullMoney Affiliate Code (optional)"
              readOnly={!!referralAttribution.affiliateCode}
              className="apple-input cursor-target"
              style={{
                width: "100%",
                backgroundColor: referralAttribution.affiliateCode ? "rgba(240,253,244,0.3)" : "#fff",
                border: referralAttribution.affiliateCode ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(0,0,0,0.1)",
                borderRadius: 12,
                padding: "14px 16px",
                paddingRight: referralAttribution.affiliateCode ? 44 : 16,
                color: "#000",
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {referralAttribution.affiliateCode && (
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                <Check style={{ width: 16, height: 16, color: "#16a34a" }} />
              </div>
            )}
            {referralAttribution.affiliateCode && (
              <p style={{ fontSize: 11, marginTop: 4, marginLeft: 4, color: "rgba(22,163,74,0.7)" }}>
                Referred by {referralAttribution.affiliateName || referralAttribution.affiliateEmail || "a BullMoney partner"}
              </p>
            )}
          </div>

          <div
            onClick={onToggleAcceptedTerms}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "rgba(0,0,0,0.02)",
              cursor: "pointer",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: "1px solid rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
                background: acceptedTerms ? "#000" : "transparent",
              }}
            >
              {acceptedTerms && <Check style={{ width: 12, height: 12, color: "#fff" }} />}
            </div>
            <p style={{ fontSize: 11, color: "rgba(0,0,0,0.45)", lineHeight: 1.6, fontWeight: 400, flex: 1 }}>
              I agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLegal("terms");
                }}
                style={{ color: "rgba(0,0,0,0.7)", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11 }}
              >
                Terms
              </button>
              {", "}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLegal("privacy");
                }}
                style={{ color: "rgba(0,0,0,0.7)", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11 }}
              >
                Privacy
              </button>
              {" & "}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLegal("disclaimer");
                }}
                style={{ color: "rgba(0,0,0,0.7)", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11 }}
              >
                Disclaimer
              </button>
            </p>
          </div>
        </div>

        {submitError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#dc2626",
              backgroundColor: "#fef2f2",
              padding: 10,
              borderRadius: 12,
              border: "1px solid #fee2e2",
              marginTop: 12,
            }}
          >
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 400 }}>{submitError}</span>
          </div>
        )}
      </StepCard>
    </motion.div>
  );
}
