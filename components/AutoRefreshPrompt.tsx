"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface RefreshDetail {
  cacheUsageMB?: number;
  cacheQuotaMB?: number;
  sessionMinutes?: number;
  cacheBloated?: boolean;
  sessionTooLong?: boolean;
}

export function AutoRefreshPrompt() {
  const [show, setShow] = useState(false);
  const [detail, setDetail] = useState<RefreshDetail | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handler = (event: Event) => {
      const custom = event as CustomEvent<RefreshDetail>;
      setDetail(custom.detail || {});
      setShow(true);
    };
    window.addEventListener("bm:auto-refresh-suggest", handler as EventListener);
    return () => window.removeEventListener("bm:auto-refresh-suggest", handler as EventListener);
  }, []);

  if (!mounted) return null;
  if (!show || !detail) return null;

  const handleRefresh = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // ignore cache clear errors
    }
    window.location.reload();
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl p-5 space-y-3">
        <div className="text-lg font-semibold text-white">Refresh recommended</div>
        <div className="text-sm text-white/70">
          We detected high cache usage or a long session. Refreshing will free space without signing you out.
        </div>
        <div className="text-xs text-white/50 space-y-1">
          {detail.cacheUsageMB !== undefined && (
            <div>Cache: {detail.cacheUsageMB.toFixed(1)} MB{detail.cacheQuotaMB ? ` / ${detail.cacheQuotaMB.toFixed(1)} MB` : ""}</div>
          )}
          {detail.sessionMinutes !== undefined && (
            <div>Session length: {Math.round(detail.sessionMinutes)} min</div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setShow(false)}
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleRefresh}
            className="flex-1 px-3 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            Refresh now
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
