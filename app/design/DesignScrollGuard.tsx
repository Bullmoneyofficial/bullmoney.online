"use client";

import { useEffect } from "react";

export function DesignScrollGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    // Ensure page starts at top (guards against focus-scroll from canvas init)
    window.scrollTo(0, 0);

    let userInteracted = false;
    const markInteracted = () => {
      userInteracted = true;
    };

    window.addEventListener("pointerdown", markInteracted, { passive: true });
    window.addEventListener("touchstart", markInteracted, { passive: true });
    window.addEventListener("wheel", markInteracted, { passive: true });
    window.addEventListener("keydown", markInteracted, { passive: true });

    const guardOnce = () => {
      if (!userInteracted && window.scrollY > 80) {
        window.scrollTo(0, 0);
      }
    };

    const timer = window.setTimeout(guardOnce, 250);
    const timer2 = window.setTimeout(guardOnce, 900);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(timer2);
      window.removeEventListener("pointerdown", markInteracted);
      window.removeEventListener("touchstart", markInteracted);
      window.removeEventListener("wheel", markInteracted);
      window.removeEventListener("keydown", markInteracted);
      window.history.scrollRestoration = prev;
    };
  }, []);

  return null;
}
