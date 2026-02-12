"use client";

import { useEffect, useState } from "react";
import { isMobileDevice } from "@/lib/mobileDetection";

/**
 * useMobileLazyRender
 * - Renders immediately on desktop/tablet
 * - On mobile, waits for idle (or a short timeout) before rendering
 *   to avoid blocking initial paint and reduce crash risk on low-end devices.
 */
export function useMobileLazyRender(delayMs = 200) {
  // Use function initializer so the check runs synchronously on client
  // This avoids the false→true flash on back-navigation
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return isMobileDevice();
    }
    return false;
  });
  const [shouldRender, setShouldRender] = useState(() => {
    if (typeof window !== "undefined") {
      return !isMobileDevice();
    }
    return true; // SSR: render immediately, client will reconcile
  });

  useEffect(() => {
    const mobile = isMobileDevice();
    setIsMobile(mobile);

    if (!mobile) {
      setShouldRender(true);
      return;
    }

    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const enableRender = () => setShouldRender(true);

    if (typeof (window as any).requestIdleCallback === "function") {
      idleId = (window as any).requestIdleCallback(enableRender, { timeout: delayMs });
    } else {
      timeoutId = window.setTimeout(enableRender, delayMs);
    }

    return () => {
      if (idleId !== null && typeof (window as any).cancelIdleCallback === "function") {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [delayMs]);

  return { isMobile, shouldRender };
}
