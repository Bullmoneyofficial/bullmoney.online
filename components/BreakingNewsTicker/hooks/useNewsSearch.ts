"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { NewsItem } from "../types";
import { SEARCH_DEBOUNCE_MS, MIN_SEARCH_LENGTH } from "../constants";
import { decodeText, getTimeAgo } from "../utils";

interface UseNewsSearchOptions {
  /** Full unfiltered news list (for local filtering) */
  news: NewsItem[];
}

/**
 * Manages local instant-filtering + remote debounced search.
 * Returns the active display list, search state, and handlers.
 */
export function useNewsSearch({ news }: UseNewsSearchOptions) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NewsItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Instant local filter as user types
  const localFiltered = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const terms = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return news.filter((item) => {
      const text =
        `${item.title} ${item.subtitle} ${item.source} ${item.category}`.toLowerCase();
      return terms.some((t) => text.includes(t));
    });
  }, [searchQuery, news]);

  // Remote search (Google News + all feeds)
  const doRemoteSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < MIN_SEARCH_LENGTH) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/breaking-news/search?q=${encodeURIComponent(query.trim())}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length > 0) {
          setSearchResults(
            data.items.map((item: NewsItem) => ({
              ...item,
              title: decodeText(item.title),
              subtitle: decodeText(item.subtitle),
              source: decodeText(item.source),
              age: getTimeAgo(item.published_at),
            })),
          );
        } else {
          setSearchResults([]);
        }
      }
    } catch {
      /* silent */
    }
    setSearching(false);
  }, []);

  // Debounced remote search while typing
  const onSearchInput = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (!value.trim()) {
        setSearchResults(null);
        return;
      }
      searchDebounceRef.current = setTimeout(
        () => doRemoteSearch(value),
        SEARCH_DEBOUNCE_MS,
      );
    },
    [doRemoteSearch],
  );

  const onSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      doRemoteSearch(searchQuery);
    },
    [searchQuery, doRemoteSearch],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchOpen(false);
  }, []);

  // Resolved display items: search results > local filter > all news
  const displayItems = searchResults ?? localFiltered ?? news;
  const isSearchActive = searchQuery.trim().length > 0;

  return {
    searchQuery,
    searchOpen,
    setSearchOpen,
    searching,
    searchInputRef,
    displayItems,
    isSearchActive,
    onSearchInput,
    onSearchSubmit,
    clearSearch,
  } as const;
}
