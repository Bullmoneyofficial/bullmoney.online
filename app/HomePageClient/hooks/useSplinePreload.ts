import { useRef, useEffect } from "react";

// ============================================================
// useSplinePreload — Spline runtime + scene preload
//
// Runs when content is visible and the heavy-desktop path is
// active. Checks browser capability before attempting to load
// the @splinetool/runtime so low-end or in-app browser users
// are never penalised.
// ============================================================

interface UseSplinePreloadParams {
  deviceTier: string;
  currentView: string;
  canRenderHeavyDesktop: boolean;
  isMobile: boolean;
  allRemoteSplines: any[];
  sequenceStage: number;
}

export function useSplinePreload({
  deviceTier,
  currentView,
  canRenderHeavyDesktop,
  isMobile,
  allRemoteSplines,
  sequenceStage,
}: UseSplinePreloadParams) {
  const splinePreloadRanRef = useRef(false);

  useEffect(() => {
    const preloadSplineEngine = async () => {
      try {
        const { detectBrowser } = await import("@/lib/browserDetection");
        const browserInfo = detectBrowser();
        const safeForSplinePreload =
          !browserInfo.isInAppBrowser &&
          browserInfo.canHandle3D &&
          !browserInfo.shouldReduceAnimations &&
          !browserInfo.isLowMemoryDevice &&
          !browserInfo.isUltraLowMemoryDevice &&
          !browserInfo.shouldDisableSpline;

        if (!safeForSplinePreload) return;
        if (splinePreloadRanRef.current) return;
        if (deviceTier === "low" || deviceTier === "minimal") return;
        if (typeof window !== "undefined" && window.innerWidth < 1024) return;

        splinePreloadRanRef.current = true;

        // Only preload Spline runtime; defer scene loading
        await Promise.allSettled([
          import("@splinetool/runtime"),
          import("@/lib/spline-wrapper"),
        ]);

        // Preload scenes only if we have the data and on idle
        if (allRemoteSplines.length > 0 && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(
            () => {
              const preloadResource = (
                href: string,
                as: HTMLLinkElement["as"] = "fetch"
              ) => {
                if (typeof document === "undefined") return;
                const selector = `link[rel="preload"][href="${href}"]`;
                if (document.querySelector(selector)) return;
                const link = document.createElement("link");
                link.rel = "preload";
                link.as = as;
                link.href = href;
                if (as === "fetch" || as === "document") {
                  link.crossOrigin = "anonymous";
                }
                document.head.appendChild(link);
              };
              allRemoteSplines.forEach((scene) => {
                preloadResource(scene.viewer, "document");
                preloadResource(scene.runtime);
              });
            },
            { timeout: 3000 }
          );
        }

        console.log("[Page] Spline runtime preloaded during", currentView);
      } catch (e) {
        console.warn("Preload failed", e);
      }
    };

    const canPreloadSpline =
      currentView === "content" && canRenderHeavyDesktop && sequenceStage >= 3;

    if (canPreloadSpline) {
      preloadSplineEngine();
    }
  }, [
    deviceTier,
    currentView,
    canRenderHeavyDesktop,
    isMobile,
    allRemoteSplines,
    sequenceStage,
  ]);
}
