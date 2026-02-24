"use client";

import React from "react";
import { ArrowRight, Check, Copy, ExternalLink } from "lucide-react";

type Props = {
  motion: any;
  StepCard: React.ComponentType<any>;
  getStepProps: (n: number) => any;
  isXM: boolean;
  disableBackdropBlur: boolean;
  activeBroker: "Vantage" | "XM";
  brokerCode: string;
  copied: boolean;
  copyCode: (code: string) => void | Promise<void>;
  onOpenBrokerLink: () => void;
  onNext: () => void;
};

export default function Step1OpenAccount({
  motion,
  StepCard,
  getStepProps,
  isXM,
  disableBackdropBlur,
  activeBroker,
  brokerCode,
  copied,
  copyCode,
  onOpenBrokerLink,
  onNext,
}: Props) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}
    >
      <StepCard
        {...getStepProps(1)}
        title="Open a Free Broker Account"
        className="register-card"
        isXM={isXM}
        disableEffects={true}
        disableBackdropBlur={disableBackdropBlur}
        actions={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <motion.button
              onClick={() => copyCode(brokerCode)}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="btn-3d-secondary cursor-target"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 14,
                padding: "12px 16px",
                fontSize: 13,
                fontWeight: 600,
                width: "100%",
                justifyContent: "center",
                color: "#000",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
            >
              {copied ? <Check style={{ height: 16, width: 16 }} /> : <Copy style={{ height: 16, width: 16 }} />}
              <span>{copied ? "Copied!" : `Copy Code: ${brokerCode}`}</span>
            </motion.button>

            <motion.button
              onClick={onOpenBrokerLink}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.96, y: 1 }}
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
                cursor: "pointer",
                boxShadow: "0 4px 20px -4px rgba(0,0,0,0.3)",
              }}
            >
              Open {activeBroker} Account <ExternalLink style={{ height: 16, width: 16 }} />
            </motion.button>

            <motion.button
              onClick={onNext}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="btn-3d-secondary cursor-target"
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 14,
                fontWeight: 500,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "#000",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
            >
              I've Opened My Account <ArrowRight style={{ width: 16, height: 16 }} />
            </motion.button>
          </div>
        }
      >
        <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16, color: "rgba(0,0,0,0.5)" }}>
          We partner with regulated brokers so you get free access. Use the code below when signing up.
        </p>

        <div
          style={{
            width: "100%",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 12,
            backgroundColor: "rgba(0,0,0,0.02)",
            border: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "rgba(0,0,0,0.3)",
                fontWeight: 500,
                display: "block",
              }}
            >
              Partner Code
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#000", letterSpacing: "0.02em" }}>{brokerCode}</span>
          </div>
          <button
            onClick={() => copyCode(brokerCode)}
            style={{ color: "rgba(0,0,0,0.4)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            {copied ? <Check style={{ height: 16, width: 16 }} /> : <Copy style={{ height: 16, width: 16 }} />}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
          <p>
            <span style={{ fontWeight: 600, color: "rgba(0,0,0,0.6)" }}>1.</span> Copy the code above
          </p>
          <p>
            <span style={{ fontWeight: 600, color: "rgba(0,0,0,0.6)" }}>2.</span> Open the broker link & paste it when signing up
          </p>
          <p>
            <span style={{ fontWeight: 600, color: "rgba(0,0,0,0.6)" }}>3.</span> Come back and tap "I've Opened My Account"
          </p>
        </div>
      </StepCard>
    </motion.div>
  );
}
