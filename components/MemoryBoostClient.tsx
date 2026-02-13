"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { triggerMemoryBoost } from "@/lib/memory";

export default function MemoryBoostClient() {
  const pathname = usePathname();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = pathname || window.location.pathname || "/";
    const key = `bm_layout_boosted_${path}`;

    let alreadyBoosted = false;
    try {
      alreadyBoosted = sessionStorage.getItem(key) === "1";
      if (!alreadyBoosted) sessionStorage.setItem(key, "1");
    } catch {
      alreadyBoosted = false;
    }

    if (alreadyBoosted) return;

    triggerMemoryBoost({
      source: hasMountedRef.current ? "layout-route-change" : "layout-initial",
      level: 0,
      path,
    });

    hasMountedRef.current = true;
  }, [pathname]);

  return null;
}
