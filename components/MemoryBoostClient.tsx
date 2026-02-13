"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { initializeMemoryGuardian, triggerMemoryBoost } from "@/lib/memory";

function getLikelyNextRoutes(pathname: string): string[] {
  const path = (pathname || "/").toLowerCase();

  if (path === "/") return ["/store", "/games"];
  if (path.startsWith("/store") || path.startsWith("/shop") || path.startsWith("/products")) return ["/", "/games"];
  if (path.startsWith("/games")) return ["/", "/store"];
  if (path.startsWith("/community")) return ["/", "/store"];

  return ["/"];
}

function shouldPrefetchRoutes(): boolean {
  if (typeof window === "undefined") return false;
  if ((window as any).__BM_ENABLE_ROUTE_PREFETCH__ !== true) return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  const connection = nav.connection;
  if (!connection) return true;
  if (connection.saveData) return false;

  const effectiveType = String(connection.effectiveType || "").toLowerCase();
  if (effectiveType.includes("2g") || effectiveType.includes("slow-2g")) return false;

  return true;
}

export default function MemoryBoostClient() {
  const router = useRouter();
  const pathname = usePathname();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const cleanup = initializeMemoryGuardian();
    return cleanup;
  }, []);

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

    if (shouldPrefetchRoutes()) {
      const prefetchKey = `bm_layout_prefetched_${path}`;
      let alreadyPrefetched = false;

      try {
        alreadyPrefetched = sessionStorage.getItem(prefetchKey) === "1";
        if (!alreadyPrefetched) sessionStorage.setItem(prefetchKey, "1");
      } catch {
        alreadyPrefetched = false;
      }

      if (!alreadyPrefetched) {
        const routes = getLikelyNextRoutes(path).filter((route) => route !== path).slice(0, 2);
        if (routes.length > 0) {
          const runPrefetch = () => {
            routes.forEach((route, index) => {
              window.setTimeout(() => {
                router.prefetch(route);
              }, 120 + index * 120);
            });
          };

          if (typeof requestIdleCallback === "function") {
            requestIdleCallback(runPrefetch, { timeout: 1200 });
          } else {
            window.setTimeout(runPrefetch, 180);
          }
        }
      }
    }

    hasMountedRef.current = true;
  }, [pathname, router]);

  return null;
}
