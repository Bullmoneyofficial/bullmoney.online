"use client";

import React from "react";
import { ArrowRight, ChevronLeft, Hash, Lock } from "lucide-react";

type Props = {
  motion: any;
  StepCard: React.ComponentType<any>;
  getStepProps: (n: number) => any;
  isXM: boolean;
  shouldReduceEffects: boolean;
  disableBackdropBlur: boolean;
  activeBroker: "Vantage" | "XM";
  mt5Number: string;
  onChangeMt5: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2VerifyId({
  motion,
  StepCard,
  getStepProps,
  isXM,
  shouldReduceEffects,
  disableBackdropBlur,
  activeBroker,
  mt5Number,
  onChangeMt5,
  onNext,
  onBack,
}: Props) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col items-center justify-center"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}
    >
      <StepCard
        {...getStepProps(2)}
        title="Enter Your Trading ID"
        className="register-card"
        isXM={isXM}
        disableEffects={shouldReduceEffects}
        disableBackdropBlur={disableBackdropBlur}
        actions={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <motion.button
              onClick={onNext}
              disabled={!mt5Number}
              whileHover={mt5Number ? { scale: 1.02, y: -2 } : {}}
              whileTap={mt5Number ? { scale: 0.96, y: 1 } : {}}
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
                cursor: mt5Number ? "pointer" : "not-allowed",
                opacity: !mt5Number ? 0.4 : 1,
                boxShadow: mt5Number ? "0 4px 20px -4px rgba(0,0,0,0.3)" : "none",
              }}
            >
              Continue <ArrowRight style={{ width: 16, height: 16 }} />
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
          <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", lineHeight: 1.6 }}>
            After signing up with {activeBroker}, check your email for your{" "}
            <span style={{ fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>MT5 Trading ID</span> (a number like 12345678).
          </p>

          <div style={{ position: "relative" }}>
            <Hash
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(0,0,0,0.25)",
                width: 18,
                height: 18,
              }}
              className="icon-float"
            />
            <input
              autoFocus
              type="tel"
              name="mt5Number"
              value={mt5Number}
              onChange={onChangeMt5}
              placeholder="e.g. 12345678"
              className="apple-input cursor-target"
              style={{
                width: "100%",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 14,
                paddingLeft: 40,
                paddingRight: 16,
                paddingTop: 14,
                paddingBottom: 14,
                color: "#000",
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", gap: 4 }}>
            <Lock style={{ width: 12, height: 12 }} /> Only used to verify access — never shared
          </p>
        </div>
      </StepCard>
    </motion.div>
  );
}
