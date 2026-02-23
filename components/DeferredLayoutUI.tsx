"use client";
// ✅ PERF: Client boundary wrapper for layout-level components that must be
// deferred (ssr: false). Moving dynamic(ssr:false) calls here keeps layout.tsx
// as a pure Server Component while still deferring these non-critical UI elements.
// Saves ~720 lines from the SSR compilation critical path.

import dynamic from "next/dynamic";

const GamesModalProvider = dynamic(
  () => import("@/components/GamesModalProvider").then(m => ({ default: m.GamesModalProvider })),
  { ssr: false }
);

const PWAInstallPrompt = dynamic(
  () => import("@/components/PWAInstallPrompt"),
  { ssr: false }
);

export function DeferredLayoutUI() {
  return (
    <>
      <GamesModalProvider />
      <PWAInstallPrompt />
    </>
  );
}
