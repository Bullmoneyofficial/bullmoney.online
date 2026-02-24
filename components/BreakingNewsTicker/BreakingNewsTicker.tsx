"use client";

import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";

// Hooks
import { useVisibilityObserver } from "./hooks/useVisibilityObserver";
import { useNewsFetch } from "./hooks/useNewsFetch";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useNewsSearch } from "./hooks/useNewsSearch";

// Sub-components
import { TickerHeader } from "./components/TickerHeader";
import { TickerScroller } from "./components/TickerScroller";
import { TopStoriesPanel } from "./components/TopStoriesPanel";
import { CategoryPulsePanel } from "./components/CategoryPulsePanel";

// Constants & styles
import { MOBILE_CONFIG, DESKTOP_CONFIG } from "./constants";
import { TICKER_STYLES } from "./styles";

export default function BreakingNewsTicker() {
  // ── Performance detection ──
  const { isMobile, isTablet } = useUnifiedPerformance();
  const isMobileDevice = isMobile || isTablet;

  const config = isMobileDevice ? MOBILE_CONFIG : DESKTOP_CONFIG;

  // ── Visibility ──
  const { containerRef, isVisible } = useVisibilityObserver();

  // ── Data fetching ──
  const { news, ready } = useNewsFetch({
    fetchInterval: config.fetchInterval,
    isVisible,
  });

  // ── Search ──
  const {
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
  } = useNewsSearch({ news });

  // ── Auto-scroll ──
  const { scrollRef, onUserScroll, pauseAuto } = useAutoScroll({
    itemCount: news.length,
    isVisible,
    scrollSpeed: config.scrollSpeed,
    duplicateCount: config.duplicateCount,
  });

  // ── Derived state ──
  if (!ready || news.length === 0) return null;

  const crit = displayItems.filter((n) => n.urgency === "critical").length;
  const urgent = displayItems.filter((n) => n.urgency === "high").length;
  const count = displayItems.length;
  const topStories = displayItems.slice(0, 4);

  return (
    <div
      ref={containerRef}
      className="w-full bg-black"
      style={{ minHeight: 190, backgroundColor: "#000000", colorScheme: "dark" as const }}
    >
      <style dangerouslySetInnerHTML={{ __html: TICKER_STYLES }} />

      {/* Header */}
      <TickerHeader
        isSearchActive={isSearchActive}
        searching={searching}
        count={count}
        searchQuery={searchQuery}
        crit={crit}
        urgent={urgent}
        totalStories={news.length}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        searchInputRef={searchInputRef}
        onSearchInput={onSearchInput}
        onSearchSubmit={onSearchSubmit}
        clearSearch={clearSearch}
      />

      {/* No results state */}
      {isSearchActive && count === 0 && !searching && (
        <div className="flex items-center justify-center h-[154px] text-zinc-500 text-sm">
          No results found for &ldquo;{searchQuery}&rdquo; — try different keywords
        </div>
      )}

      {/* Loading state for search */}
      {searching && count === 0 && (
        <div className="flex items-center justify-center h-[154px] gap-2">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-400 text-sm">Searching Google News &amp; feeds...</span>
        </div>
      )}

      {/* Scrollable ticker */}
      {count > 0 && (
        <TickerScroller
          displayItems={displayItems}
          isSearchActive={isSearchActive}
          duplicateCount={config.duplicateCount}
          scrollRef={scrollRef}
          onUserScroll={onUserScroll}
          pauseAuto={pauseAuto}
        />
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      {/* Bottom panels */}
      <div className="px-4 py-4 grid gap-3 sm:grid-cols-2">
        <TopStoriesPanel topStories={topStories} />
        <CategoryPulsePanel
          displayItems={displayItems}
          crit={crit}
          urgent={urgent}
          count={count}
        />
      </div>
    </div>
  );
}
