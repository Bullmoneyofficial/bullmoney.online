import { useState, useEffect } from "react";

// ============================================================
// useViewportDetect — Reactive viewport size detection
//
// Returns { hasMounted, isMobile, isDesktop, isUltraWide }.
// All values default to false to match SSR and prevent
// hydration mismatches. State is populated in a single
// consolidated useEffect after mount.
// ============================================================

export interface ViewportState {
  hasMounted: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isUltraWide: boolean;
}

export function useViewportDetect(): ViewportState {
  // ✅ HYDRATION OPTIMIZED: Initialize as false to match server render
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isUltraWide, setIsUltraWide] = useState(false);

  // ── Consolidated viewport listeners (was 2 separate effects) ─
  useEffect(() => {
    setHasMounted(true);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    const desktopMq = window.matchMedia("(min-width: 1024px)");
    const ultraWideMq = window.matchMedia("(min-width: 1980px)");
    setIsDesktop(desktopMq.matches);
    setIsUltraWide(ultraWideMq.matches);

    const updateDesktop = (event: MediaQueryListEvent) =>
      setIsDesktop(event.matches);
    const updateUltraWide = (event: MediaQueryListEvent) =>
      setIsUltraWide(event.matches);

    window.addEventListener("resize", checkMobile);
    desktopMq.addEventListener("change", updateDesktop);
    ultraWideMq.addEventListener("change", updateUltraWide);

    return () => {
      window.removeEventListener("resize", checkMobile);
      desktopMq.removeEventListener("change", updateDesktop);
      ultraWideMq.removeEventListener("change", updateUltraWide);
    };
  }, []);

  return { hasMounted, isMobile, isDesktop, isUltraWide };
}
