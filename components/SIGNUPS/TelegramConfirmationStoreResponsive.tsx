"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Gift,
  Link2,
  Loader2,
  Lock,
  Newspaper,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  Unlock,
  Video,
  Bell,
} from "lucide-react";

const TELEGRAM_GROUP_LINK = "https://t.me/addlist/uswKuwT2JUQ4YWI8";
const MINIMUM_WAIT_TIME = 3000;
const DESKTOP_BREAKPOINT = 1024;

const UNLOCK_BENEFITS = [
  { icon: TrendingUp, label: "Free Trades" },
  { icon: Video, label: "Live Streams" },
  { icon: Bell, label: "Real-time Updates" },
  { icon: Newspaper, label: "Market News" },
  { icon: Gift, label: "Exclusive Groups" },
];

interface TelegramConfirmationStoreProps {
  onUnlock: () => void;
  onConfirmationClicked: () => void;
  isXM: boolean;
  neonIconClass: string;
}

const robustCopy = async (text: string): Promise<boolean> => {
  if (!text) return false;
  try {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {}
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText =
      "position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;z-index:-1;";
    document.body.appendChild(textarea);
    const range = document.createRange();
    range.selectNodeContents(textarea);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    textarea.setSelectionRange(0, textarea.value.length);
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
};

function TelegramConfirmationStoreScreen({
  onUnlock,
  onConfirmationClicked,
  isXM,
  isDesktop,
}: TelegramConfirmationStoreProps & { isDesktop: boolean }) {
  const [joinedTelegram, setJoinedTelegram] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MINIMUM_WAIT_TIME / 1000);
  const [canUnlock, setCanUnlock] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      const inApp = /Instagram|FBAN|FBAV|TikTok|musical_ly|Line\/|GSA|Twitter|Snapchat|LinkedInApp|wv\)|Telegram/i.test(
        ua
      );
      setIsInAppBrowser(inApp);
    }
  }, []);

  useEffect(() => {
    if (!joinedTelegram) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MINIMUM_WAIT_TIME - elapsed);
      const secondsLeft = Math.ceil(remaining / 1000);
      setTimeRemaining(secondsLeft);
      if (remaining <= 0) {
        clearInterval(interval);
        setCanUnlock(true);
        setShowCelebration(true);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [joinedTelegram]);

  const handleCopy = async (text: string, label: string) => {
    const ok = await robustCopy(text);
    if (ok) {
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 1500);
    }
  };

  const handleTelegramClick = () => {
    setJoinedTelegram(true);
    try {
      const link = document.createElement("a");
      link.href = TELEGRAM_GROUP_LINK;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const newWindow = window.open(TELEGRAM_GROUP_LINK, "_blank", "noopener,noreferrer");
      if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      window.location.href = TELEGRAM_GROUP_LINK;
    }
  };

  const openInBackground = (url: string) => {
    const tab = window.open(url, "_blank", "noopener,noreferrer");
    if (tab) {
      try {
        tab.blur();
        window.focus();
      } catch {}
    }
  };

  const accent = isXM ? "#ef4444" : "#0ea5e9";
  const accentSoft = isXM ? "rgba(239, 68, 68, 0.12)" : "rgba(14, 165, 233, 0.12)";
  const cardPadding = isDesktop ? "27px" : "10px";
  const titleSize = isDesktop ? "27px" : "13px";
  const subTitleSize = isDesktop ? "15px" : "8px";
  const buttonSize = isDesktop ? "99px" : "45px";
  const maxWidth = isDesktop ? "540px" : "210px";

  const shimmerStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(120deg, rgba(14,165,233,0) 0%, rgba(14,165,233,0.08) 50%, rgba(14,165,233,0) 100%)",
      animation: "storeTelegramShimmer 6s ease-in-out infinite",
      pointerEvents: "none",
      opacity: 0.6,
    }),
    []
  );

  return (
    <>
      <style jsx global>{`
        @keyframes storeTelegramPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes storeTelegramFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes storeTelegramGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(14,165,233,0.25); }
          50% { box-shadow: 0 0 25px rgba(14,165,233,0.35); }
        }
        @keyframes storeTelegramShimmer {
          0% { transform: translateX(-60%); }
          100% { transform: translateX(60%); }
        }
        @keyframes storeTelegramSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isDesktop ? "48px" : "20px",
          overflow: "auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 20% 15%, ${accentSoft}, transparent 45%), radial-gradient(circle at 80% 30%, rgba(15,23,42,0.05), transparent 40%)`,
          }}
        />
        <div style={shimmerStyle} />
          <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth,
            background: "rgba(255,255,255,0.92)",
            borderRadius: isDesktop ? "33px" : "18px",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
            padding: cardPadding,
            display: "flex",
            flexDirection: "column",
              gap: isDesktop ? "24px" : "12px",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? "11px" : "7px", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: isDesktop ? "6px" : "4px" }}>
              <div
                style={{
                  width: isDesktop ? "11px" : "7px",
                  height: isDesktop ? "11px" : "7px",
                  borderRadius: "50%",
                  background: "#0f172a",
                  boxShadow: "0 0 8px rgba(15,23,42,0.25)",
                }}
              />
              <div
                style={{
                  width: isDesktop ? "11px" : "7px",
                  height: isDesktop ? "11px" : "7px",
                  borderRadius: "50%",
                  background: "#0f172a",
                  boxShadow: "0 0 8px rgba(15,23,42,0.25)",
                }}
              />
              <div
                style={{
                  width: isDesktop ? "11px" : "7px",
                  height: isDesktop ? "11px" : "7px",
                  borderRadius: "50%",
                  background: joinedTelegram ? "#0f172a" : "rgba(15,23,42,0.35)",
                  boxShadow: joinedTelegram
                    ? "0 0 8px rgba(15,23,42,0.35)"
                    : "0 0 6px rgba(15,23,42,0.2)",
                }}
              />
            </div>
            <span style={{ fontSize: isDesktop ? "12px" : "8px", color: "rgba(15,23,42,0.6)", fontWeight: 600 }}>
              Final Step
            </span>
          </div>

          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: titleSize, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Join the BullMoney Telegram
            </h2>
            <p style={{ fontSize: subTitleSize, color: "rgba(15,23,42,0.6)", margin: "4px 0 0" }}>
              One tap unlocks everything free for the store
            </p>
          </div>

          <div
            style={{
              background: "rgba(248,250,252,0.9)",
              borderRadius: isDesktop ? "18px" : "12px",
              border: "1px solid rgba(15,23,42,0.08)",
              padding: isDesktop ? "17px" : "8px",
              display: "flex",
              flexDirection: "column",
              gap: isDesktop ? "12px" : "7px",
            }}
          >
            {canUnlock ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isDesktop ? "9px" : "6px" }}>
                  <Sparkles style={{ width: isDesktop ? 18 : 12, height: isDesktop ? 18 : 12, color: accent }} />
                  <span style={{ fontSize: isDesktop ? "14px" : "9px", fontWeight: 700, color: "#0f172a" }}>Broker Setup</span>
                </div>
                {isInAppBrowser && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: isDesktop ? "9px" : "6px",
                      borderRadius: isDesktop ? "12px" : "8px",
                      background: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      padding: isDesktop ? "11px 12px" : "7px 8px",
                    }}
                  >
                    <AlertTriangle style={{ width: isDesktop ? 18 : 12, height: isDesktop ? 18 : 12, color: "#f59e0b", marginTop: 1 }} />
                    <p style={{ margin: 0, fontSize: isDesktop ? "12px" : "8px", color: "rgba(120,53,15,0.9)", lineHeight: 1.4 }}>
                      You are in an in-app browser. Copy the links below and open them in Chrome or Safari to sign up.
                    </p>
                  </div>
                )}
                <p style={{ margin: 0, fontSize: isDesktop ? "12px" : "8px", color: "rgba(15,23,42,0.7)", textAlign: "center" }}>
                  {isInAppBrowser
                    ? "Copy each broker link and code below, then open them in your main browser to sign up."
                    : "When you click Enter Bull Money, your broker accounts open in background tabs so you can finish setup fast."}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: isDesktop ? "9px" : "6px" }}>
                  <div
                    style={{
                      borderRadius: isDesktop ? "12px" : "8px",
                      background: "#ffffff",
                      border: "1px solid rgba(15,23,42,0.1)",
                      padding: isDesktop ? "11px 12px" : "7px 8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: isDesktop ? "9px" : "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: isDesktop ? "12px" : "8px", color: "rgba(15,23,42,0.6)" }}>XM Partner Code</span>
                      <span style={{ fontSize: isDesktop ? "12px" : "8px", fontWeight: 700, color: "#0f172a" }}>X3R7P</span>
                    </div>
                    <div style={{ display: "flex", gap: isDesktop ? "6px" : "4px" }}>
                      <button
                        onClick={() => handleCopy("X3R7P", "xm-code")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: isDesktop ? "5px" : "3px",
                          padding: isDesktop ? "6px 0" : "4px 0",
                          borderRadius: isDesktop ? "9px" : "6px",
                          border: "1px solid rgba(15,23,42,0.12)",
                          background: copiedItem === "xm-code" ? "rgba(34,197,94,0.15)" : "rgba(15,23,42,0.04)",
                          cursor: "pointer",
                        }}
                      >
                        {copiedItem === "xm-code" ? (
                          <Check style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "#16a34a" }} />
                        ) : (
                          <Copy style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "rgba(15,23,42,0.6)" }} />
                        )}
                        <span style={{ fontSize: isDesktop ? "11px" : "7px", color: "rgba(15,23,42,0.7)" }}>
                          {copiedItem === "xm-code" ? "Copied" : "Copy Code"}
                        </span>
                      </button>
                      <button
                        onClick={() => handleCopy("https://affs.click/t5wni", "xm-link")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: isDesktop ? "5px" : "3px",
                          padding: isDesktop ? "6px 0" : "4px 0",
                          borderRadius: isDesktop ? "9px" : "6px",
                          border: "1px solid rgba(15,23,42,0.12)",
                          background: copiedItem === "xm-link" ? "rgba(34,197,94,0.15)" : "rgba(15,23,42,0.04)",
                          cursor: "pointer",
                        }}
                      >
                        {copiedItem === "xm-link" ? (
                          <Check style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "#16a34a" }} />
                        ) : (
                          <Link2 style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "rgba(15,23,42,0.6)" }} />
                        )}
                        <span style={{ fontSize: isDesktop ? "11px" : "7px", color: "rgba(15,23,42,0.7)" }}>
                          {copiedItem === "xm-link" ? "Copied" : "Copy Link"}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator
                              .share({
                                title: "XM Broker Signup",
                                text: "Sign up with XM using partner code: X3R7P",
                                url: "https://affs.click/t5wni",
                              })
                              .catch(() => {});
                          } else {
                            handleCopy("Sign up with XM using partner code: X3R7P - https://affs.click/t5wni", "xm-share");
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: isDesktop ? "6px 9px" : "4px 6px",
                          borderRadius: isDesktop ? "9px" : "6px",
                          border: "1px solid rgba(15,23,42,0.12)",
                          background: copiedItem === "xm-share" ? "rgba(34,197,94,0.15)" : "rgba(15,23,42,0.04)",
                          cursor: "pointer",
                        }}
                      >
                        {copiedItem === "xm-share" ? (
                          <Check style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "#16a34a" }} />
                        ) : (
                          <Share2 style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "rgba(15,23,42,0.6)" }} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: isDesktop ? "12px" : "8px",
                      background: "#ffffff",
                      border: "1px solid rgba(15,23,42,0.1)",
                      padding: isDesktop ? "11px 12px" : "7px 8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: isDesktop ? "9px" : "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: isDesktop ? "12px" : "8px", color: "rgba(15,23,42,0.6)" }}>Vantage Partner Code</span>
                      <span style={{ fontSize: isDesktop ? "12px" : "8px", fontWeight: 700, color: "#0f172a" }}>BULLMONEY</span>
                    </div>
                    <div style={{ display: "flex", gap: isDesktop ? "6px" : "4px" }}>
                      <button
                        onClick={() => handleCopy("BULLMONEY", "v-code")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: isDesktop ? "5px" : "3px",
                          padding: isDesktop ? "6px 0" : "4px 0",
                          borderRadius: isDesktop ? "9px" : "6px",
                          border: "1px solid rgba(15,23,42,0.12)",
                          background: copiedItem === "v-code" ? "rgba(34,197,94,0.15)" : "rgba(15,23,42,0.04)",
                          cursor: "pointer",
                        }}
                      >
                        {copiedItem === "v-code" ? (
                          <Check style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "#16a34a" }} />
                        ) : (
                          <Copy style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "rgba(15,23,42,0.6)" }} />
                        )}
                        <span style={{ fontSize: isDesktop ? "11px" : "7px", color: "rgba(15,23,42,0.7)" }}>
                          {copiedItem === "v-code" ? "Copied" : "Copy Code"}
                        </span>
                      </button>
                      <button
                        onClick={() => handleCopy("https://vigco.co/iQbe2u", "v-link")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: isDesktop ? "5px" : "3px",
                          padding: isDesktop ? "6px 0" : "4px 0",
                          borderRadius: isDesktop ? "9px" : "6px",
                          border: "1px solid rgba(15,23,42,0.12)",
                          background: copiedItem === "v-link" ? "rgba(34,197,94,0.15)" : "rgba(15,23,42,0.04)",
                          cursor: "pointer",
                        }}
                      >
                        {copiedItem === "v-link" ? (
                          <Check style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "#16a34a" }} />
                        ) : (
                          <Link2 style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "rgba(15,23,42,0.6)" }} />
                        )}
                        <span style={{ fontSize: isDesktop ? "11px" : "7px", color: "rgba(15,23,42,0.7)" }}>
                          {copiedItem === "v-link" ? "Copied" : "Copy Link"}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator
                              .share({
                                title: "Vantage Broker Signup",
                                text: "Sign up with Vantage using partner code: BULLMONEY",
                                url: "https://vigco.co/iQbe2u",
                              })
                              .catch(() => {});
                          } else {
                            handleCopy(
                              "Sign up with Vantage using partner code: BULLMONEY - https://vigco.co/iQbe2u",
                              "v-share"
                            );
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: isDesktop ? "6px 9px" : "4px 6px",
                          borderRadius: isDesktop ? "9px" : "6px",
                          border: "1px solid rgba(15,23,42,0.12)",
                          background: copiedItem === "v-share" ? "rgba(34,197,94,0.15)" : "rgba(15,23,42,0.04)",
                          cursor: "pointer",
                        }}
                      >
                        {copiedItem === "v-share" ? (
                          <Check style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "#16a34a" }} />
                        ) : (
                          <Share2 style={{ width: isDesktop ? 14 : 9, height: isDesktop ? 14 : 9, color: "rgba(15,23,42,0.6)" }} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: isDesktop ? "11px" : "7px", color: "rgba(15,23,42,0.5)", textAlign: "center" }}>
                  Use these codes when signing up so your trading is linked and ready to go.
                </p>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isDesktop ? "9px" : "6px" }}>
                  <Gift style={{ width: isDesktop ? 18 : 12, height: isDesktop ? 18 : 12, color: accent }} />
                  <span style={{ fontSize: isDesktop ? "14px" : "9px", fontWeight: 700, color: "#0f172a" }}>What You Unlock</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: isDesktop ? "9px" : "4px",
                  }}
                >
                  {UNLOCK_BENEFITS.map((benefit) => {
                    const Icon = benefit.icon;
                    return (
                      <div
                        key={benefit.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: isDesktop ? "9px" : "4px",
                          padding: isDesktop ? "9px 10px" : "4px 6px",
                          borderRadius: isDesktop ? "12px" : "8px",
                          border: "1px solid rgba(15,23,42,0.08)",
                          background: "rgba(255,255,255,0.9)",
                        }}
                      >
                        <Icon style={{ width: isDesktop ? 15 : 9, height: isDesktop ? 15 : 9, color: "#0f172a" }} />
                        <span
                          style={{
                            fontSize: isDesktop ? "12px" : "7px",
                            fontWeight: 600,
                            color: "rgba(15,23,42,0.85)",
                          }}
                        >
                          {benefit.label}
                        </span>
                        {joinedTelegram && (
                          <Check style={{ width: isDesktop ? 14 : 8, height: isDesktop ? 14 : 8, color: accent, marginLeft: "auto" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: isDesktop ? "9px" : "6px",
                    padding: isDesktop ? "11px 12px" : "6px 7px",
                    borderRadius: isDesktop ? "12px" : "8px",
                    border: `1px solid ${joinedTelegram ? accent : "rgba(15,23,42,0.15)"}`,
                    background: joinedTelegram ? accentSoft : "rgba(15,23,42,0.04)",
                  }}
                >
                  {joinedTelegram ? (
                    <Unlock style={{ width: isDesktop ? 17 : 11, height: isDesktop ? 17 : 11, color: accent }} />
                  ) : (
                    <Lock style={{ width: isDesktop ? 17 : 11, height: isDesktop ? 17 : 11, color: "rgba(15,23,42,0.6)", animation: "storeTelegramPulse 2s ease-in-out infinite" }} />
                  )}
                  <span style={{ fontSize: isDesktop ? "12px" : "7px", fontWeight: 700, color: "#0f172a" }}>
                    {joinedTelegram ? "Website Access Unlocked" : "Full Website Access"}
                  </span>
                  {joinedTelegram && <Sparkles style={{ width: isDesktop ? 17 : 11, height: isDesktop ? 17 : 11, color: accent }} />}
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isDesktop ? "12px" : "6px" }}>
            <span
              style={{
                fontSize: isDesktop ? "12px" : "7px",
                color: "rgba(15,23,42,0.65)",
                fontWeight: 600,
              }}
            >
              {joinedTelegram ? "Telegram Opened" : "Tap to join our free community"}
            </span>
            <button
              onClick={handleTelegramClick}
              disabled={joinedTelegram}
              style={{
                width: buttonSize,
                height: buttonSize,
                borderRadius: "999px",
                border: `2px solid ${accent}`,
                background: joinedTelegram ? accentSoft : "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: joinedTelegram ? "default" : "pointer",
                boxShadow: "0 11px 26px rgba(14,165,233,0.2)",
                animation: joinedTelegram ? "storeTelegramPulse 0.6s ease-in-out" : "storeTelegramFloat 4s ease-in-out infinite",
              }}
            >
              {joinedTelegram ? (
                <Check style={{ width: isDesktop ? 42 : 20, height: isDesktop ? 42 : 20, color: accent }} />
              ) : (
                <Send style={{ width: isDesktop ? 42 : 20, height: isDesktop ? 42 : 20, color: accent }} />
              )}
            </button>
            <button
              onClick={() => {
                localStorage.setItem("bullmoney_telegram_confirmed", "true");
                robustCopy("X3R7P");
                if (!isInAppBrowser) {
                  openInBackground("https://affs.click/t5wni");
                  setTimeout(() => {
                    openInBackground("https://vigco.co/iQbe2u");
                  }, 600);
                }
                localStorage.setItem("bullmoney_xm_redirect_done", "true");
                onConfirmationClicked();
                onUnlock();
              }}
              disabled={!canUnlock}
              style={{
                width: "100%",
                padding: isDesktop ? "15px 20px" : "8px 11px",
                borderRadius: isDesktop ? "14px" : "9px",
                border: `2px solid ${canUnlock ? accent : "rgba(15,23,42,0.2)"}`,
                background: canUnlock ? accent : "transparent",
                color: canUnlock ? "#ffffff" : "rgba(15,23,42,0.5)",
                fontSize: isDesktop ? "15px" : "9px",
                fontWeight: 700,
                cursor: canUnlock ? "pointer" : "not-allowed",
                boxShadow: canUnlock ? "0 20px 32px rgba(14,165,233,0.25)" : "none",
                transition: "all 0.3s ease",
              }}
            >
              {canUnlock ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Unlock style={{ width: isDesktop ? 18 : 12, height: isDesktop ? 18 : 12 }} />
                  Enter Bull Money
                </span>
              ) : joinedTelegram ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Loader2 style={{ width: isDesktop ? 17 : 11, height: isDesktop ? 17 : 11, animation: "storeTelegramSpin 1s linear infinite" }} />
                  Unlocking in {timeRemaining}s
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Lock style={{ width: isDesktop ? 17 : 11, height: isDesktop ? 17 : 11 }} />
                  Join Telegram First
                </span>
              )}
            </button>
            {showCelebration && (
              <p style={{ margin: 0, fontSize: isDesktop ? "12px" : "7px", color: accent, fontWeight: 600 }}>
                You unlocked full access.
              </p>
            )}
          </div>

          {isDesktop && (
            <p style={{ margin: 0, fontSize: "12px", color: "rgba(15,23,42,0.5)", textAlign: "center" }}>
              Join traders already in our community. 100% free forever.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export const TelegramConfirmationStoreResponsive: React.FC<TelegramConfirmationStoreProps> = (props) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!mounted) {
    return <TelegramConfirmationStoreScreen {...props} isDesktop={false} />;
  }

  return <TelegramConfirmationStoreScreen {...props} isDesktop={isDesktop} />;
};

export { TelegramConfirmationStoreScreen };
