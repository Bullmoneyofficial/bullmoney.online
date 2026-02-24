"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsItem } from "../types";
import { FETCH_GUARD_MS } from "../constants";
import { decodeText, getTimeAgo } from "../utils";

interface UseNewsFetchOptions {
  fetchInterval: number;
  isVisible: boolean;
}

/**
 * Manages news fetching, polling, deduplication, and hydrated state.
 * Skips fetches when the page is hidden or the component is off-screen.
 */
export function useNewsFetch({ fetchInterval, isVisible }: UseNewsFetchOptions) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [ready, setReady] = useState(false);
  const lastHashRef = useRef("");
  const lastFetchRef = useRef(0);

  const fetchNews = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - lastFetchRef.current < fetchInterval - FETCH_GUARD_MS) return;
    lastFetchRef.current = now;

    try {
      const res = await fetch("/api/breaking-news", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.items?.length) return;

      const incoming: NewsItem[] = data.items.map((item: NewsItem) => ({
        ...item,
        title: decodeText(item.title),
        subtitle: decodeText(item.subtitle),
        source: decodeText(item.source),
        age: getTimeAgo(item.published_at),
      }));

      const hash = incoming.map((n) => n.link).join("|");
      if (hash === lastHashRef.current) return;
      lastHashRef.current = hash;

      setNews((prev) => {
        if (prev.length === 0) return incoming;
        const existingMap = new Map(prev.map((n) => [n.link, n]));
        return incoming.map((n) => {
          const existing = existingMap.get(n.link);
          // Keep existing object reference if title/link unchanged so memo skips re-render
          if (existing && existing.title === n.title) {
            return { ...existing, age: n.age };
          }
          return n;
        });
      });
    } catch {
      /* silent */
    }
  }, [fetchInterval]);

  useEffect(() => {
    if (!isVisible) return;
    fetchNews().then(() => setReady(true));
    const id = setInterval(fetchNews, fetchInterval);
    return () => clearInterval(id);
  }, [fetchNews, isVisible, fetchInterval]);

  return { news, ready } as const;
}
