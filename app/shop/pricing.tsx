"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  IconCheck,
  IconClipboard,
  IconClipboardCheck,
  IconExternalLink,
  IconDownload,
  IconChevronDown,
} from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useRef } from "react";
import { supabase } from "@/lib/supabaseClient"; // <-- ENSURED CORRECT SUPABASE IMPORT

// --- THEME CONSTANTS FOR HELPERS ---
const BLUE_SHIMMER_GRADIENT = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #38bdf8 50%, #00000000 100%)";
const BLUE_TEXT_GRADIENT = "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400";

// ============================================================================
// HELPER TIP COMPONENT (BLUE/BLACK THEME)
// ============================================================================

const HelperTip = ({ label, className }: { label: string; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 5, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 5, scale: 0.9 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    // z-[100] ensures the tip is over everything
    className={cn("absolute z-[100] flex flex-col items-center pointer-events-none", className)}
  >
    {/* The Bubble */}
    <div className="relative p-[1.5px] overflow-hidden rounded-full shadow-lg shadow-sky-500/20">
        <motion.div 
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: BLUE_SHIMMER_GRADIENT }}
        />
        <div className="relative z-10 px-3 py-1 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-sky-500/40">
            <span className={cn("bg-clip-text text-transparent text-[10px] font-bold whitespace-nowrap", BLUE_TEXT_GRADIENT)}>
                {label}
            </span>
        </div>
    </div>
    {/* The Triangle Pointer (pointing down) */}
    <div className="w-2 h-2 bg-[#0a0a0a] rotate-45 -translate-y-[4px] relative z-10 border-b border-r border-sky-500/40" />
  </motion.div>
);

// ============================================================================
// PRICING COMPONENT (MAIN EXPORT)
// ============================================================================

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "BullMoney Free Trading Community Access",
  description:
    "Get free, limited access to the BullMoney trading community when you sign up with our partner brokers Vantage or XM using our codes and trade actively within 30 days.",
  url: "https://bullmoney.online",
  publisher: {
    "@type": "Organization",
    name: "BullMoney",
    url: "https://bullmoney.online",
  },
  mainEntity: {
    "@type": "HowTo",
    name: "How to get free access to the BullMoney community",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Open your broker account with our code",
        itemListElement: [
          "Choose Vantage or XM from the BullMoney website.",
          "Open a live trading account using our official partner code.",
          "Use the same email you’ll use inside the BullMoney community.",
        ],
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Trade actively within the first 30 days",
        itemListElement: [
          "Fund your account with an amount that matches your plan.",
          "Place real trades within the first 30 days on that broker.",
          "Stay compliant with broker rules and avoid abuse.",
        ],
      },
      {
      "@type": "HowToStep",
        position: 3,
        name: "Submit proof and unlock BullMoney Free Access",
        itemListElement: [
          "Submit your email, MT5 ID and proof via the BullMoney form.",
          "Our team verifies that you used our code and traded actively.",
          "Once verified, you’re invited into the Free Access community.",
        ],
      },
    ],
  },
};

export function Pricing() {
  const [copied, setCopied] = React.useState(false);
  const [activePartner, setActivePartner] = React.useState<"Vantage broker" | "XM">(
    "Vantage broker"
  );
  // --- TIP LOGIC ---
  const [activeTipIndex, setActiveTipIndex] = React.useState(0);
  
  // Cycle tips: 0 = CTA, 1 = Tabs, 2 = Step 1 Code, 3 = Step 3 Submit
  React.useEffect(() => {
    const interval = setInterval(() => {
        setActiveTipIndex(prev => (prev + 1) % 4); 
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  const copyPartnerCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {}
  };

  return (
    <section
      id="pricing"
      className="relative isolate w-full bg-blue dark:bg-neutral-950 px-4 py-12 sm:py-16 lg:px-4"
    >
      
      {/* SEO / Hero Header */}
      <header className="text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-purple-500">
          TELEGRAM • DISCORD • TRADING COMMUNITY
        </p>

        <h1
  className={cn(
    "mt-2 text-2xl md:text-4xl font-black tracking-tight",
    "text-neutral-900 dark:text-white"
  )}
>
  <span
    className={cn(
      "bg-clip-text text-transparent inline-block transition-all duration-300",
      activePartner === "Vantage broker"
        ? "bg-gradient-to-r from-purple-400 via-violet-500 to-fuchsia-400 drop-shadow-[0_8px_28px_rgba(168,85,247,0.35)]"
        : "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 drop-shadow-[0_8px_28px_rgba(56,189,248,0.35)]"
    )}
  >
    BULLMONEY ALSO HAS A FREE OPTION!
  </span>{" "}
  <span className="text-white block mt-1"> When You Sign Up With Our Partner Brokers
    </span>
</h1>


        <div className="mt-3 flex flex-col items-center justify-center gap-3">
          <p className="text-bmPurple text-sm md:text-base text-center mt-3 max-w-2xl mx-auto">
  Can't afford VIP yet? You can still plug into BullMoney Free Access with limited features and benifits when you open an account.
</p>

        </div>

        <div className="mt-4 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-3">
            <ThreeBadge activePartner={activePartner} />
            <span className="text-2xl md:text-4xl font-extrabold text-neutral-900 dark:text-white text-center">
              STEPS ONLY
            </span>
          </div>

          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-purple-500 dark:text-neutral-400">
            1. SIGN UP • 2. USE OUR CODE • 3. SUBMIT PROOF
          </p>
        </div>
      </header>

      {/* Video / Sign-up CTA (TIP 0) */}
      <div className="relative">
          <AnimatePresence>
            {activeTipIndex === 0 && <HelperTip label="Watch How-To Video" className="top-8 left-1/2 -translate-x-1/2" />}
          </AnimatePresence>
          <SignUpCTA
            activePartner={activePartner}
            vantageHref="https://youtu.be/Q3dSjSP3t8I?si=79NQfv3gmbbjy2IB"
            xmHref="https://youtu.be/NVkHSPVnacM?si=WYgUacleLzV1X0r1"
          />
      </div>

      {/* What you get with Free Access */}
<div className="mx-auto mt-10 max-w-5xl text-center">

 {/* Partner Tabs (with animated glow) (TIP 1) */}
      <div className="mt-10 flex justify-center gap-3 relative">
        <AnimatePresence>
            {activeTipIndex === 1 && <HelperTip label="Choose Your Broker" className="-top-10 left-1/2 -translate-x-1/2" />}
        </AnimatePresence>
        {(["Vantage broker", "XM"] as const).map((partner) => {
          const isActive = activePartner === partner;
          return (
            <button
              key={partner}
              onClick={() => setActivePartner(partner)}
              className={cn(
                "relative px-6 py-2 rounded-full font-semibold transition-all duration-300",
                isActive
                  ? "text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              )}
              aria-pressed={isActive}
            >
              {partner}
              {isActive && (
                <motion.span
                  layoutId="tab-pill"
                  className={cn(
                    "absolute inset-0 -z-10 rounded-full",
                    partner === "Vantage broker"
                      ? "bg-gradient-to-r from-purple-500 to-violet-600 shadow-[0_0_25px_rgba(168,85,247,0.45)]"
                      : "bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_25px_rgba(56,189,248,0.45)]"
                  )}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Animated Steps switcher */}
      <div className="relative mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePartner}
            initial={{ opacity: 0, x: activePartner === "XM" ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activePartner === "XM" ? 40 : -40 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            {activePartner === "XM" ? (
              <XMThreeSteps 
                copyPartnerCode={copyPartnerCode} 
                copied={copied} 
                showCodeTip={activeTipIndex === 2}
                showSubmitTip={activeTipIndex === 3}
              />
            ) : (
              <VantageThreeSteps 
                copyPartnerCode={copyPartnerCode} 
                copied={copied} 
                showCodeTip={activeTipIndex === 2}
                showSubmitTip={activeTipIndex === 3}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <h1
  className={cn(
    "mt-2 text-2xl md:text-4xl font-black tracking-tight",
    "text-neutral-900 dark:text-white"
  )}
>

</h1>
  <p className="mt-2 text-xs md:text-sm text-neutral-500 dark:text-neutral-300">
    Free Access is{" "}
    <span className="font-semibold text-white">not VIP</span>, but it still gives
    you real value while you build your account and skills.
  </p>

  <p className="mt-4 text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
    VIP includes{" "}
    <span className="font-semibold text-white">
      full indicators, Live stream lessons, and more.
    </span>{" "}
    Free Access is a lighter version built for traders who aren't ready for VIP yet.
  </p>
</div>

      {/* VIP comparison / premium section unchanged structurally */}
      <LuxeCardReactive
  variant={activePartner === "Vantage broker" ? "vantage" : "xm"}
  className="mx-auto mt-12 max-w-7xl"
>
  <header className="flex flex-col items-center text-center gap-1">
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase",
        activePartner === "Vantage broker"
          ? "text-purple-300/70"
          : "text-sky-300/70"
      )}
    >
      <span
        className={cn(
          "h-[6px] w-[6px] rounded-full shadow-[0_0_18px_rgba(233,215,168,0.45)]",
          activePartner === "Vantage broker"
            ? "bg-gradient-to-r from-purple-400 to-violet-500 shadow-[0_0_18px_rgba(168,85,247,0.45)]"
            : "bg-gradient-to-r from-sky-400 to-blue-500 shadow-[0_0_18px_rgba(56,189,248,0.45)]"
        )}
      />
      LIMITED BENEFITS • FREE COMMUNITY
    </span>

    <h3 className="mt-1 text-2xl md:text-3xl font-black leading-tight">
      <span
        className={cn(
          "bg-clip-text text-transparent",
          activePartner === "Vantage broker"
            ? "bg-gradient-to-r from-purple-400 via-violet-500 to-fuchsia-400"
            : "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400"
        )}
      >
        WHAT YOU GET WITH FREE ACCESS
      </span>
    </h3>
  </header>

  <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
    {["Access to a limited BullMoney Telegram community.",
    "Starter trade ideas & basic setups (not full VIP streams).",
    "Occasional market breakdowns & recap content.",
    "Priority consideration for VIP when you're ready to upgrade.",
    "Broker deposit bonuses & partner-only promotions (where available).",
    "Trading-focused environment with rules & accountability.",].map((f) => (
      <li
        key={f}
        className="flex items-center gap-3 text-[15px] text-neutral-200"
      >
        <span
          className={cn(
            "relative inline-grid place-items-center h-5 w-5 rounded-full ring-1",
            activePartner === "Vantage broker"
              ? "bg-[#0E0F12] ring-purple-500/25"
              : "bg-[#0E0F12] ring-sky-500/25"
          )}
        >
          <span
            className={cn(
              "h-[9px] w-[9px] rotate-45 rounded-[2px] shadow-[0_0_14px]",
              activePartner === "Vantage broker"
                ? "bg-gradient-to-br from-purple-400 via-violet-500 to-fuchsia-400 shadow-[0_0_14px_rgba(168,85,247,0.4)]"
                : "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-400 shadow-[0_0_14px_rgba(56,189,248,0.4)]"
            )}
          />
        </span>

        <span className="font-semibold tracking-wide">{f}</span>
      </li>
    ))}
  </ul>

  <p className="mt-6 text-[13px] md:text-sm text-neutral-300/85 leading-relaxed text-center">
    Expect{" "}
    <span
      className={cn(
        "font-semibold",
        activePartner === "Vantage broker" ? "text-purple-300" : "text-sky-300"
      )}
    >
      Elite Mentorship
    </span>
    ,{" "}
    <span
      className={cn(
        "font-semibold",
        activePartner === "Vantage broker" ? "text-purple-300" : "text-sky-300"
      )}
    >
      High Trade Setups
    </span>{" "}
    and powerful tools tailored for you.{" "}
    <span
      className={cn(
        "font-semibold",
        activePartner === "Vantage broker" ? "text-purple-300" : "text-sky-300"
      )}
    >
      Free Access is a preview — VIP is the full experience.
    </span>
  </p>
</LuxeCardReactive>


      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </section>
  );
}
/* --------------------------------------------------------------------------
   Partner-specific step layouts 
-------------------------------------------------------------------------- */

function XMThreeSteps({ copyPartnerCode, copied, showCodeTip, showSubmitTip }: any) {
  return (
    <div
      className={cn(
        "w-full mt-10 grid gap-6 md:mt-12",        
        "grid-cols-1 md:grid-cols-2"               
      )}
    >

      {/* STEP 1 - Onboarding hero (XM) */}
      <StepCard
        number={1}
        title="Step 1 — Open Your XM Live Account With Our Code"
        className="col-span-1 md:col-span-2 p-6 md:p-8 bg-gradient-to-br from-sky-950 via-slate-950 to-neutral-950 relative" // Added relative for tip
        actions={
          <div className="flex flex-wrap items-center justify-center gap-3 relative">
            {/* TIP 2: Code Button */}
            <AnimatePresence>
                {showCodeTip && <HelperTip label="Copy Code First" className="-top-12 left-[15%]" />}
            </AnimatePresence>
            
            <button
              onClick={() => copyPartnerCode("X3R7P")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
                         text-sky-300 ring-1 ring-inset ring-sky-500/40 hover:bg-sky-500/10 transition"
            >
              {copied ? (
                <>
                  <IconClipboardCheck className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <IconClipboard className="h-4 w-4" />
                  Copy XM Code
                </>
              )}
            </button>

            <a
              href="https://affs.click/t5wni"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
                         text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700
                         shadow transition"
            >
              <span>Open XM account</span>
              <IconExternalLink className="h-4 w-4" />
            </a>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed text-neutral-200">
          To unlock <Accent>Free Access</Accent> via XM, you MUST open a{" "}
          <span className="font-semibold text-white">real XM trading account</span> using our partner
          code <span className="font-semibold text-white">X3R7P</span>. This helps us keep the
          community free for traders who are genuinely active.
        </p>

        <ul className="mt-3 space-y-2 text-sm">
          <FeatureItem>Use code X3R7P during sign-up (required).</FeatureItem>
          <FeatureItem>Complete your XM KYC and choose a live account type.</FeatureItem>
          <FeatureItem>Use the same email you’ll submit in Step 3.</FeatureItem>
        </ul>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
          <div className="relative mx-auto w-full max-w-[380px] h-44 sm:h-52 rounded-3xl border border-white/15 shadow-[0_24px_60px_rgba(15,23,42,0.8)]">
            <IconPlusCorners />
            <div className="absolute inset-0 p-2">
              <EvervaultCard text="X3R7P" className="h-full w-full" />
            </div>
          </div>

          <div className="space-y-3 text-xs md:text-sm text-neutral-300">
            <p>
              This is your official{" "}
              <span className="font-semibold text-sky-300">BullMoney XM code</span>.{" "}
              <span className="font-semibold text-white">No code = no Free Access.</span>
            </p>

            <div className="flex flex-wrap gap-2">
              <TrustPill>Regulated broker path</TrustPill>
              <TrustPill>Secure signup via XM</TrustPill>
              <TrustPill>No extra fees from BullMoney</TrustPill>
            </div>
          </div>
        </div>
      </StepCard>

      {/* STEP 2 */}
      <StepCard
        number={2}
        title="Step 2 — Trade Actively for 30 Days on XM"
        className="col-span-1"   
        actions={
          <a
            href="/BULLMONEYULTRA.pdf"
            download
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
                       text-black bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400
                       hover:from-gray-300 hover:via-gray-400 hover:to-gray-500
                       shadow-lg shadow-gray-900/40 transition"
          >
            <IconDownload className="h-4 w-4" />
            Download Free + VIP Overview
          </a>
        }
      >
        <p className="text-[15px] leading-relaxed text-neutral-300">
          After your account is open,{" "}
          <span className="font-semibold text-white">fund it and trade actively</span> within the
          first 30 days. We check that you used{" "}
          <span className="font-semibold text-white">X3R7P</span> and that the account is truly
          active — not just a zero-trade account.
        </p>

        <Accordion className="mt-3">
          <AccordionItem title="Minimum requirements to stay eligible" defaultOpen>
            <ul className="mt-1 space-y-2">
              <ProofItem>You used code BULLMONEY when opening the account.</ProofItem>
              <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => copyPartnerCode("X3R7P")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
                text-blue-300 ring-1 ring-inset ring-blue-500/40 hover:bg-blue-500/10 transition"
            >
              {copied ? (
                <>
                  <IconClipboardCheck className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <IconClipboard className="h-4 w-4" />
                  Copy XM Code
                </>
              )}
            </button>

            <a
              href="https://affs.click/t5wni"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
                text-white bg-gradient-to-r from-purple-blue to-blue-600 hover:from-blue-600 hover:to-fuchsia-700
                shadow transition"
            >
              <span>Open XM account</span>
              <IconExternalLink className="h-4 w-4" />
            </a>
          </div>
              <ProofItem>You placed real trades within first 30 days.</ProofItem>
            </ul>
            
          </AccordionItem>
          <AccordionItem title="Why we require active trading">
            <p className="text-[15px] leading-relaxed text-neutral-300">
              Active traders sustain the community and allow BullMoney to offer free value.
            </p>
          </AccordionItem>
        </Accordion>
      </StepCard>

      {/* STEP 3 */}
      <StepCard
        number={3}
        title="Submit Proof using our code: X3R7P"
        className="col-span-1" 
      >
        <SubmitProofForm showTip={showSubmitTip} />
      </StepCard>
    </div>
  );
}


/* ============================================================================
   VANTAGE FIXED
============================================================================ */

function VantageThreeSteps({ copyPartnerCode, copied, showCodeTip, showSubmitTip }: any) {
  return (
   <div
  className={cn(
    "w-full mt-10 grid gap-6 md:mt-12", 
    "grid-cols-1 md:grid-cols-2"        
  )}
>


      {/* STEP 1 */}
      <StepCard
        number2={1}
        title="Open Your Vantage Live Account With BULLMONEY"
        className="col-span-1 md:col-span-2 p-6 md:p-8 bg-gradient-to-br from-purple-950 via-slate-950 to-neutral-950 relative" // Added relative for tip
        actions={
          <div className="flex flex-wrap items-center justify-center gap-3 relative">
            {/* TIP 2: Code Button */}
            <AnimatePresence>
                {showCodeTip && <HelperTip label="Copy Code First" className="-top-12 left-[15%]" />}
            </AnimatePresence>

            <button
              onClick={() => copyPartnerCode("BULLMONEY")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
                text-purple-300 ring-1 ring-inset ring-purple-500/40 hover:bg-purple-500/10 transition"
            >
              {copied ? (
                <>
                  <IconClipboardCheck className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <IconClipboard className="h-4 w-4" />
                  Copy Vantage Code
                </>
              )}
            </button>

            <a
              href="https://vigco.co/iQbe2u"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
                text-white bg-gradient-to-r from-purple-500 to-violet-600 hover:from-violet-600 hover:to-fuchsia-700
                shadow transition"
            >
              <span>Open Vantage account</span>
              <IconExternalLink className="h-4 w-4" />
            </a>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed text-neutral-200">
          To unlock <Accent2>Free Access</Accent2> through Vantage, open a{" "}
          <span className="font-semibold text-white">real Vantage trading account</span> using the official
          BullMoney referral code <span className="font-semibold text-white">BULLMONEY</span>.
        </p>

        <ul className="mt-3 space-y-2 text-sm">
          <FeatureItem>Enter BULLMONEY during registration.</FeatureItem>
          <FeatureItem>Complete KYC and pick a live account.</FeatureItem>
          <FeatureItem>Use same email you submit in Step 3.</FeatureItem>
        </ul>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
          <div className="relative mx-auto w-full max-w-[380px] h-44 sm:h-52 rounded-3xl border border-white/15 shadow-[0_24px_60px_rgba(15,23,42,0.8)]">
            <IconPlusCorners />
            <div className="absolute inset-0 p-2">
              <EvervaultCardRed text="BULLMONEY" className="h-full w-full" />
            </div>
          </div>

          <div className="space-y-3 text-xs md:text-sm text-neutral-300">
            <p>
              This is your official{" "}
              <span className="font-semibold text-purple-300">BullMoney Vantage code</span>.
            </p>

            <div className="flex flex-wrap gap-2">
              <TrustPill>Partnered with Vantage</TrustPill>
              <TrustPill>Fast onboarding</TrustPill>
              <TrustPill>No BullMoney fees</TrustPill>
            </div>
          </div>
        </div>
      </StepCard>

      {/* STEP 2 */}
      <StepCard
        number2={2}
        title="Trade Actively for 30 Days on Vantage"
        className="col-span-1" 
        
      >
        <p className="text-[15px] leading-relaxed text-neutral-300">
          Once your account is live,{" "}
          <span className="font-semibold text-white">fund it and start trading</span>.
        </p>

        <Accordion className="mt-3">
          <AccordionItem title="Minimum requirements to stay eligible" defaultOpen>
            <ul className="mt-1 space-y-2">
              <ProofItem>You used code BULLMONEY when opening the account.</ProofItem>
              <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => copyPartnerCode("BULLMONEY")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
                text-purple-300 ring-1 ring-inset ring-purple-500/40 hover:bg-purple-500/10 transition"
            >
              {copied ? (
                <>
                  <IconClipboardCheck className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <IconClipboard className="h-4 w-4" />
                  Copy Vantage Code
                </>
              )}
            </button>

            <a
              href="https://vigco.co/iQbe2u"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
                text-white bg-gradient-to-r from-purple-500 to-violet-600 hover:from-violet-600 hover:to-fuchsia-700
                shadow transition"
            >
              <span>Open Vantage account</span>
              <IconExternalLink className="h-4 w-4" />
            </a>
          </div>
              <ProofItem>You placed real trades within first 30 days.</ProofItem>
            </ul>
            
          </AccordionItem>
          <AccordionItem title="Why we require active trading">
            <p className="text-[15px] leading-relaxed text-neutral-300">
              Active traders sustain the community and allow BullMoney to offer free value.
            </p>
          </AccordionItem>
        </Accordion>
      </StepCard>

      {/* STEP 3 */}
      <StepCard
        number2={3}
        title="Submit Proof using our code: BULLMONEY"
        className="col-span-1" // FIX: Now correctly aligns side-by-side with Step 2 on desktop
      >
        <SubmitProofForm showTip={showSubmitTip} />
      </StepCard>
    </div>
  );
}


/* ============================================================================
   Step card + Accordion (unchanged)
============================================================================ */

type StepCardProps =
  | {
      number: number;
      number2?: never;
      title: string;
      children: React.ReactNode;
      actions?: React.ReactNode;
      className?: string;
    }
  | {
      number?: never;
      number2: number;
      title: string;
      children: React.ReactNode;
      actions?: React.ReactNode;
      className?: string;
    };

function StepCard({
  number,
  number2,
  title,
  children,
  actions,
  className,
}: StepCardProps) {
  const useRed = typeof number2 === "number";
  const n = useRed ? number2! : number!;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5",
        "bg-neutral-900/70 ring-1 ring-white/10 backdrop-blur-sm",
        "shadow-[0_1px_1px_rgba(0,0,0,0.05),0_8px_40px_rgba(2,6,23,0.35)]",
        "transition will-change-transform hover:-translate-y-0.5 hover:ring-sky-500/30",
        className
      )}
    >
      <div className="pointer-events-none absolute -top-12 right-0 h-24 w-2/3 bg-gradient-to-l from-sky-500/15 via-blue-500/10 to-indigo-500/0 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded-md ring-1",
            useRed
              ? "text-purple-300/90 ring-purple-500/30 bg-purple-500/10"
              : "text-sky-300/90 ring-sky-500/30 bg-sky-500/10"
          )}
        >
          Step {n}
        </span>

        <span className="relative text-4xl md:text-5xl font-black bg-clip-text text-transparent">
          <span
            className={cn(
              "bg-gradient-to-br bg-clip-text text-transparent",
              useRed
                ? "from-purple-400 via-violet-500 to-fuchsia-400"
                : "from-sky-400 via-blue-500 to-indigo-400"
            )}
          >
            {n}
          </span>
          <span
            className={cn(
              "pointer-events-none absolute inset-0 -z-10 blur-2xl bg-gradient-to-br",
              useRed
                ? "from-purple-500/40 via-violet-600/30 to-fuchsia-500/40"
                : "from-sky-500/40 via-blue-600/30 to-indigo-500/40"
            )}
          />
        </span>
      </div>

      <h3 className="mt-3 text-2xl font-extrabold text-white">{title}</h3>

      <div className="mt-3 flex min-h-[130px] flex-col">
        <div className="flex-1">{children}</div>

        {actions ? (
          <div className="mt-6 flex items-center justify-center pt-4 border-t border-white/10">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Accordion({ className, children }: any) {
  return <div className="space-y-2">{children}</div>;
}

function AccordionItem({ title, children, defaultOpen = false }: any) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-xl ring-1 ring-white/10 bg-white/[0.03] backdrop-blur-sm",
        "hover:ring-sky-500/30 transition"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o: boolean) => !o)}   
        className="flex w-full items-center justify-between px-3 py-2"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {title}
        </span>
        <IconChevronDown
          className={cn(
            "h-4 w-4 text-sky-300 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="px-3 pb-3 text-sm">{children}</div>
      </motion.div>
    </div>
  );
}


/* ============================================================================
   VIP panel with mouse-follow shimmer (unchanged)
============================================================================ */

function ShimmerPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  const glow = useMotionTemplate`radial-gradient(220px at ${mx}px ${my}px, rgba(56,189,248,.20), transparent 60%)`;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/10",
        "bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm",
        "shadow-[0_1px_1px_rgba(0,0,0,0.05),0_12px_60px_rgba(2,6,23,0.35)]",
        className
      )}
    >
      {/* animated border aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl p-[1px]"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, rgba(56,189,248,.25), rgba(99,102,241,.25), rgba(129,140,248,.3), rgba(56,189,248,.25))",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* mouse-follow shimmer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />

      {children}
    </div>
  );
}

/* ============================================================================
   Small bits (unchanged)
============================================================================ */

function ProofItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-neutral-300">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
        <IconCheck className="h-3.5 w-3.5 text-emerald-300" />
      </span>
      <span className="font-medium">{children}</span>
    </li>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-neutral-300">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700">
        <IconCheck className="h-3 w-3 text-neutral-300 [stroke-width:4px]" />
      </span>
      <span className="font-semibold">{children}</span>
    </li>
  );
}

function FreePerk({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-neutral-950/70 px-3 py-2 text-xs md:text-sm text-neutral-200 shadow-[0_18px_45px_rgba(0,0,0,0.6)]">
      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <p>{children}</p>
    </div>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {children}
    </span>
  );
}

function Accent({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-extrabold bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
      {children}
    </span>
  );
}
export function Accent2({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-extrabold bg-gradient-to-r from-purple-400 via-violet-500 to-fuchsia-400 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

/* Decorative corner plus glyphs for the code box (unchanged) */
function IconPlusCorners() {
  return (
    <>
      <PlusMini className="absolute h-4 w-4 -top-2 -left-2 text-white/70" />
      <PlusMini className="absolute h-4 w-4 -bottom-2 -left-2 text-white/70" />
      <PlusMini className="absolute h-4 w-4 -top-2 -right-2 text-white/70" />
      <PlusMini className="absolute h-4 w-4 -bottom-2 -right-2 text-white/70" />
    </>
  );
}

function PlusMini({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
}

/* ============================================================================
   INLINE Evervault-style Card (reactive code badge) (unchanged)
============================================================================ */

export const EvervaultCard = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = React.useState("");

  React.useEffect(() => {
    setRandomString(generateRandomString(1500));
  }, []);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }

  return (
    <div
      className={cn(
        "p-0.5 bg-transparent aspect-square flex items-center justify-center w-full h-full relative",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center"
      >
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-40 w-40 sm:h-44 sm:w-44 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/80 dark:bg-black/80 blur-md" />
            <span className="relative z-20 font-extrabold text-2xl sm:text-4xl text-black dark:text-white select-none">
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function CardPattern({
  mouseX,
  mouseY,
  randomString,
}: {
  mouseX: any;
  mouseY: any;
  randomString: string;
}) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50" />
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 to-blue-700 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-white font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

export const EvervaultCardRed = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = React.useState("");

  React.useEffect(() => {
    setRandomString(generateRandomString(1500));
  }, []);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }

  return (
    <div
      className={cn(
        "p-0.5 bg-transparent aspect-square flex items-center justify-center w-full h-full relative",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center"
      >
        <CardPatternRed mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-40 w-40 sm:h-44 sm:w-44 rounded-full flex items-center justify-center">
            {/* subtle glass behind the code */}
            <div className="absolute inset-0 rounded-full bg-white/85 dark:bg-black/80 blur-md" />
            <span className="relative z-20 font-extrabold text-2xl sm:text-4xl text-black dark:text-white select-none">
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function CardPatternRed({
  mouseX,
  mouseY,
  randomString,
}: {
  mouseX: any;
  mouseY: any;
  randomString: string;
}) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };

  return (
    <div className="pointer-events-none">
      {/* top gloss */}
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50" />
      {/* interactive red gradient glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-600 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      {/* binary/monospace overlay with red tint */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-violet-50/90 dark:text-violet-100/90 font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
      {/* soft ambient red bloom when hovered (outside the mask) */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-purple-500/20" />
    </div>
  );
}

const characters = "BULLMONEY";
export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/* ============================================================================
   Step 3 Submit Proof Form
============================================================================ */

function SubmitProofForm({ showTip }: { showTip: boolean }) {
  const [email, setEmail] = React.useState("");
  const [mt5Id, setMt5Id] = React.useState("");
  const [usedCode, setUsedCode] = React.useState("yes");
  const [referredByCode, setReferredByCode] = React.useState(""); // Maps to referred_by_code
  const [socialHandle, setSocialHandle] = React.useState(""); // Maps to social_handle
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!mt5Id.trim()) {
      setError("Please enter your MetaTrader 5 ID.");
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.from("recruits").insert([
        {
          email,
          password: 'password', 
          mt5_id: mt5Id,
          referred_by_code: referredByCode || null, 
          social_handle: socialHandle || null,
          used_code: usedCode === "yes",
        },
      ]);

      if (error) throw error;

      setEmail("");
      setMt5Id("");
      setUsedCode("yes");
      setReferredByCode(""); 
      setSocialHandle(""); 
      setSuccess(true);

      setTimeout(() => {
        window.location.href = "https://t.me/addlist/gg09afc4lp45YjQ0";
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong while saving your data. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
      {/* Email */}
      <label className="text-sm font-medium text-neutral-300">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg bg-neutral-900/60 ring-1 ring-white/10 px-3 py-2 text-white outline-none focus:ring-purple-500/40"
          placeholder="you@example.com"
        />
      </label>

      {/* MetaTrader ID */}
      <label className="text-sm font-medium text-neutral-300">
        MetaTrader 5 ID
        <input
          required
          value={mt5Id}
          onChange={(e) => setMt5Id(e.target.value)}
          className="mt-1 w-full rounded-lg bg-neutral-900/60 ring-1 ring-white/10 px-3 py-2 text-white outline-none focus:ring-purple-500/40"
          placeholder="e.g. 12345678"
        />
      </label>

      {/* Used our code */}
      <label className="text-sm font-medium text-neutral-300">
        Did you use our partner code?
        <select
          value={usedCode}
          onChange={(e) => setUsedCode(e.target.value)}
          className="mt-1 w-full rounded-lg bg-neutral-900/60 ring-1 ring-white/10 px-3 py-2 text-white outline-none focus:ring-purple-500/40"
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
      
      {/* Social Handle (New field: social_handle) */}
      <label className="text-sm font-medium text-neutral-300">
        Telegram/Discord/Social Handle (optional)
        <input
          value={socialHandle}
          onChange={(e) => setSocialHandle(e.target.value)}
          className="mt-1 w-full rounded-lg bg-neutral-900/60 ring-1 ring-white/10 px-3 py-2 text-white outline-none focus:ring-purple-500/40"
          placeholder="e.g. @bullmoney_user"
        />
      </label>

      {/* Affiliate/Referral Code (Maps to: referred_by_code) */}
      <label className="text-sm font-medium text-neutral-300">
        Affiliate/Referral Code (optional)
        <input
          value={referredByCode}
          onChange={(e) => setReferredByCode(e.target.value)}
          className="mt-1 w-full rounded-lg bg-neutral-900/60 ring-1 ring-white/10 px-3 py-2 text-white outline-none focus:ring-purple-500/40"
          placeholder="Code you used (e.g., BULLMONEY or bmt_justin)"
        />
      </label>


      {/* Submit Button (TIP 3) */}
      <div className="mt-2 flex items-center justify-center pt-4 border-t border-white/10 relative">
        <AnimatePresence>
            {showTip && !success && (
                <HelperTip label="Submit Final Proof" className="-top-10 left-1/2 -translate-x-1/2" />
            )}
        </AnimatePresence>
        <button
          type="submit"
          disabled={sending}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-black",
            "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 hover:from-gray-300 hover:via-gray-400 hover:to-gray-500",
            "shadow-lg shadow-gray-900/40 transition",
            sending && "opacity-70 cursor-not-allowed"
          )}
        >
          {sending ? "Submitting..." : "Submit"}
        </button>
      </div>

      {error && <p className="text-center text-red-400 text-sm">{error}</p>}
      {success && (
        <p className="text-center text-emerald-400 text-sm">
          ✅ Submission successful! Redirecting you to Telegram...
        </p>
      )}
    </form>
  );
}

/* ============================================================================
   LuxeCardReactive (unchanged)
============================================================================ */

export function LuxeCardReactive({
  children,
  className,
  variant = "vantage", 
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "vantage" | "xm" | "neutral";
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const theme = {
    vantage: {
      glow1: "rgba(168,85,247,0.20)", 
      glow2: "rgba(147,51,234,0.10)",
      ring: "rgba(147,51,234,0.35)",
      border: "rgba(168,85,247,0.25)",
      particle1: "#A855F7",
      particle2: "#9333EA",
      conic:
        "conic-gradient(from 180deg, rgba(168,85,247,.22), rgba(147,51,234,.22), rgba(126,34,206,.22), rgba(168,85,247,.22))",
    },
    xm: {
      glow1: "rgba(16,185,129,0.20)", 
      glow2: "rgba(5,150,105,0.10)",
      ring: "rgba(5,150,105,0.35)",
      border: "rgba(16,185,129,0.25)",
      particle1: "#10B981",
      particle2: "#059669",
      conic:
        "conic-gradient(from 180deg, rgba(16,185,129,.22), rgba(5,150,105,.22), rgba(4,120,87,.22), rgba(16,185,129,.22))",
    },
    neutral: {
      glow1: "rgba(125,125,125,0.20)",
      glow2: "rgba(80,80,80,0.10)",
      ring: "rgba(120,120,120,0.35)",
      border: "rgba(150,150,150,0.20)",
      particle1: "#999",
      particle2: "#777",
      conic:
        "conic-gradient(from 180deg, rgba(255,255,255,.12), rgba(200,200,200,.12), rgba(160,160,160,.12), rgba(255,255,255,.12))",
    },
  }[variant];

  const mx = useSpring(useMotionValue(0), {
    stiffness: 220,
    damping: 26,
    mass: 0.6,
  });
  const my = useSpring(useMotionValue(0), {
    stiffness: 220,
    damping: 26,
    mass: 0.6,
  });

  const tiltX = useSpring(0, { stiffness: 180, damping: 18 });
  const tiltY = useSpring(0, { stiffness: 180, damping: 18 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    mx.set(x);
    my.set(y);

    const dx = (x / r.width) * 2 - 1;
    const dy = (y / r.height) * 2 - 1;
    tiltX.set(dy * 6);
    tiltY.set(-dx * 6);
  };

  const onLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const glow = useMotionTemplate`
    radial-gradient(220px at ${mx}px ${my}px,
      ${theme.glow1},
      ${theme.glow2} 45%,
      transparent 70%)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "relative overflow-hidden rounded-[22px] p-6 md:p-8",
        "bg-[linear-gradient(180deg,#0A0B0E_0%,#0D0F13_100%)]",
        `ring-1`,
        className
      )}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: `0 2px 12px rgba(0,0,0,0.35), 0 40px 120px rgba(0,0,0,0.65), 0 0 25px ${theme.ring}`,
      }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 180, damping: 17 }}
    >
      {/* dynamic border */}
      <div className="pointer-events-none absolute inset-0 rounded-[22px]">
        <div className="absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/5"></div>
        <div
          className="absolute inset-[1px] rounded-[21px] ring-1 ring-inset"
          style={{ borderColor: theme.border }}
        ></div>
      </div>

      {/* animated conic border */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[22px]"
        style={{
          background: theme.conic,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: 1,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      />

      {/* cursor glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />

      {/* sheen */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-x-1 -top-1 h-[120%] rotate-12 
        bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]"
        initial={{ x: "-120%" }}
        whileHover={{ x: "120%" }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />

      {/* particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, ${theme.particle1} 0.5px, transparent 1.5px),
              radial-gradient(circle at 80% 70%, ${theme.particle2} 0.5px, transparent 1.5px)
            `,
            backgroundSize: "20px 20px, 22px 22px",
          }}
        />
      </div>

      {/* tilt content */}
      <motion.div
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ============================================================================
   3 Badge (unchanged)
============================================================================ */

function ThreeBadge({ activePartner }: { activePartner: "Vantage broker" | "XM" }) {
  const isVantage = activePartner === "Vantage broker";

  return (
    <motion.span
      key={activePartner}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "relative inline-block text-5xl md:text-7xl font-black bg-clip-text text-transparent",
        isVantage
          ? "bg-gradient-to-r from-purple-400 via-violet-500 to-fuchsia-400 drop-shadow-[0_10px_35px_rgba(168,85,247,0.28)]"
          : "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 drop-shadow-[0_10px_35px_rgba(56,189,248,0.25)]"
      )}
    >
      3
      <span
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 blur-2xl bg-gradient-to-r",
          isVantage
            ? "from-purple-500/30 via-violet-600/30 to-fuchsia-500/30"
            : "from-sky-500/30 via-blue-600/30 to-indigo-500/30"
        )}
      />
    </motion.span>
  );
}

/* ============================================================================
   SignUpCTA (unchanged)
============================================================================ */

function SignUpCTA({
  activePartner,
  vantageHref,
  xmHref,
}: {
  activePartner: "Vantage broker" | "XM";
  vantageHref: string;
  xmHref: string;
}) {
  const isVantage = activePartner === "Vantage broker";
  const href = isVantage ? vantageHref : xmHref;
  const label = isVantage
    ? "Watch how to sign up on Vantage with the BULLMONEY code"
    : "Watch how to sign up on XM with the X3R7P code";

  const glowFrames = isVantage
    ? [
        "0 0 20px rgba(168,85,247,0.30)",
        "0 0 45px rgba(147,51,234,0.50)",
        "0 0 20px rgba(168,85,247,0.30)",
      ]
    : [
        "0 0 20px rgba(56,189,248,0.30)",
        "0 0 45px rgba(59,130,246,0.50)",
        "0 0 20px rgba(56,189,248,0.30)",
      ];

  return (
    <div className="mt-8 flex justify-center">
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.96 }}
        animate={{ scale: [1, 1.04, 1], boxShadow: glowFrames }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "relative inline-flex items-center gap-2 rounded-full px-10 py-4 text-[15px] font-semibold tracking-wide transition-all duration-500 backdrop-blur-md text-white",
          isVantage
            ? // VANTAGE
              "border border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:border-purple-400/70 hover:shadow-[0_0_55px_rgba(168,85,247,0.6)] \
       bg-[linear-gradient(115deg,rgba(109,40,217,0.85)_0%,rgba(124,58,237,0.92)_45%,rgba(147,51,234,0.95)_100%)] \
       before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-[radial-gradient(60%_80%_at_50%_0%,rgba(168,85,247,0.25),transparent_60%)]"
            : // XM
              "border border-sky-500/50 shadow-[0_0_35px_rgba(56,189,248,0.45)] hover:border-sky-400/80 hover:shadow-[0_0_65px_rgba(56,189,248,0.75)] \
       bg-[linear-gradient(115deg,rgba(14,165,233,0.98)_0%,rgba(37,99,235,0.97)_45%,rgba(59,130,246,0.95)_100%)] \
       before:absolute before:inset-0 before:-z-10 before:rounded-full before:blur-xl before:opacity-60 \
       before:bg-[radial-gradient(70%_90%_at_50%_0%,rgba(56,189,248,0.45),transparent_70%)]"
        )}
      >
        {label}
        <IconExternalLink
          className={cn("h-4 w-4", isVantage ? "text-purple-300" : "text-sky-300")}
        />
        <motion.span
          className={cn(
            "absolute inset-0 rounded-full opacity-0 blur-md ring-2",
            isVantage ? "ring-purple-500/20" : "ring-sky-500/20"
          )}
          whileHover={{ opacity: 0.6, scale: 1.1 }}
          transition={{ duration: 0.5 }}
        />
      </motion.a>
    </div>
  );
}