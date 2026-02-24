"use client";

// ============================================================
// HomePageClient — Dynamic (lazy-loaded) Component Declarations
//
// All next/dynamic() calls are consolidated here so the main
// orchestrator file stays lean and the lazy-load strategy is
// easy to audit in one place.
// ============================================================

import dynamic from "next/dynamic";
import {
  HeroSkeleton,
  MinimalFallback,
} from "@/components/MobileLazyLoadingFallback";

// ── Navigation ───────────────────────────────────────────────
// Store Header replaces the default navbar on the app page.
export const StoreHeader = dynamic(
  () =>
    import("@/components/store/StoreHeader").then((mod) => ({
      default: mod.StoreHeader,
    })),
  { ssr: false }
) as any;

// ── Side-effect-only hooks rendered as components ────────────
// useShowcaseScroll (461+134 lines) and useAudioEngine (359 lines)
// are side-effect-only hooks with no return values consumed by the
// parent. Wrapping them as dynamic components defers their module
// resolution entirely from the initial compile chain.

export const LazyShowcaseScroll = dynamic(
  () =>
    import("@/hooks/useShowcaseScroll").then((mod) => ({
      default: function ShowcaseScrollEffect(props: {
        startDelay: number;
        enabled: boolean;
        pageId: string;
        persistInSession: boolean;
      }) {
        mod.useShowcaseScroll(props);
        return null;
      },
    })),
  { ssr: false }
);

export const LazyAudioEngine = dynamic(
  () =>
    import("@/app/hooks/useAudioEngine").then((mod) => ({
      default: function AudioEngineEffect({
        enabled,
        mode,
      }: {
        enabled: boolean;
        mode: "MECHANICAL" | "SOROS" | "SCI-FI" | "SILENT";
      }) {
        mod.useAudioEngine(enabled, mode);
        return null;
      },
    })),
  { ssr: false }
);

// ── Performance systems ──────────────────────────────────────
export const HomePagePerformanceSystems = dynamic(
  () => import("@/app/HomePagePerformanceSystems"),
  { ssr: false }
);

// ── Hero components ──────────────────────────────────────────
export const DiscordMobileHero = dynamic(
  () => import("@/components/MobileDiscordHero"),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

// ── Onboarding flow ──────────────────────────────────────────
export const TelegramUnlockScreen = dynamic(
  () =>
    import(
      "@/components/SIGNUPS/TelegramConfirmationResponsive"
    ).then((mod) => ({
      default: mod.TelegramConfirmationResponsive,
    })),
  { ssr: false, loading: () => <MinimalFallback /> }
);
