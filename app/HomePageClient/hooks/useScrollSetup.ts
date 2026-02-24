import { useEffect } from "react";

// ============================================================
// useScrollSetup — Scroll lock recovery + scroll-to-top
//
// Runs once on mount. Handles two concerns:
// 1. Recovers from any scroll-lock that StoreHeader (or another
//    overlay) may have left on the <html>/<body> element.
// 2. Forces the page to start at the top and prevents the
//    browser from auto-restoring the previous scroll position.
// ============================================================

export function useScrollSetup() {
  // ── Scroll lock recovery + class/attribute setup ──────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const body = document.body;

    // Safety: recover if StoreHeader (or another overlay) left the document
    // scroll-locked. Prevents "stuck" home page after opening menus/drawers.
    try {
      const hasStoreHeaderLock =
        body.getAttribute("data-storeheader-scroll-lock") === "true" ||
        root.getAttribute("data-storeheader-scroll-lock") === "true" ||
        body.style.position === "fixed";

      if (hasStoreHeaderLock) {
        const top = body.style.top || "0px";
        const lockedY = Math.abs(parseInt(top, 10) || 0);
        body.removeAttribute("data-storeheader-scroll-lock");
        root.removeAttribute("data-storeheader-scroll-lock");
        body.style.position = "";
        body.style.top = "";
        body.style.left = "";
        body.style.right = "";
        body.style.width = "";
        if (lockedY) {
          window.scrollTo({ top: lockedY, behavior: "auto" });
        }
      }
    } catch {
      // ignore
    }

    // Safety: clear residual splash sway class on route entry
    root.classList.remove("bm-sway", "bm-sway-safe");
    body.classList.remove("bm-sway", "bm-sway-safe");

    // NOTE: Don't remove drunk scroll here — it's used by showcase scroll
    // animation. forceScrollEnabler will handle cleanup when not active.

    root.classList.add("home-active");
    body.classList.add("home-page-body");
    root.setAttribute("data-app-page", "true");
    body.setAttribute("data-app-page", "true");

    // Force enable scrolling (lazy-loaded: 342 lines)
    let cleanup: (() => void) | undefined;
    import("@/lib/forceScrollEnabler").then((mod) => {
      cleanup = mod.forceEnableScrolling();
    });

    return () => {
      root.classList.remove("home-active");
      body.classList.remove("home-page-body");
      root.removeAttribute("data-app-page");
      body.removeAttribute("data-app-page");
      cleanup?.();
    };
  }, []);

  // ── Prevent browser scroll-position auto-restoration ─────
  useEffect(() => {
    if (typeof window === "undefined") return;

    let previousRestoration: string | undefined;
    if ("scrollRestoration" in window.history) {
      previousRestoration = (window.history as any).scrollRestoration;
      (window.history as any).scrollRestoration = "manual";
    }

    // Start at top of page
    const { pathname, search } = window.location;
    window.history.replaceState(null, "", pathname + search);
    window.scrollTo({ top: 0, behavior: "auto" });

    return () => {
      if (
        previousRestoration !== undefined &&
        "scrollRestoration" in window.history
      ) {
        (window.history as any).scrollRestoration = previousRestoration;
      }
    };
  }, []);
}
