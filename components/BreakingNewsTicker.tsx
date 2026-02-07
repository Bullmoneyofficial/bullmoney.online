"use client";

import { useState, useEffect, useCallback, memo, useRef, useMemo } from "react";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";

interface NewsItem {
  title: string;
  subtitle: string;
  link: string;
  source: string;
  category: string;
  image: string | null;
  published_at: string;
  urgency: "critical" | "high" | "medium" | "normal";
  age: string;
}

const ICONS: Record<string, string> = {
  markets: "📊", stocks: "📈", forex: "💱", crypto: "₿",
  commodities: "🛢️", geopolitics: "🌍", economics: "🏛️", tech: "💻",
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function BreakingNewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [ready, setReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NewsItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHashRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const userScrollingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Performance detection
  const { isMobile, isTablet, shouldSkipHeavyEffects, performanceTier } = useUnifiedPerformance();
  const isMobileDevice = isMobile || isTablet;
  
  // Mobile-optimized settings
  const scrollSpeed = isMobileDevice ? 0.5 : 1;
  const fetchInterval = isMobileDevice ? 15000 : 10000; // 15s on mobile, 10s on desktop
  const duplicateCount = isMobileDevice ? 2 : 3; // Less duplication on mobile

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/breaking-news", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.items?.length > 0) {
        const incoming: NewsItem[] = data.items.map((item: NewsItem) => ({
          ...item,
          age: getTimeAgo(item.published_at),
        }));
        const hash = incoming.map((n: NewsItem) => n.link).join("|");
        if (hash !== lastHashRef.current) {
          lastHashRef.current = hash;
          // Merge: keep existing items that are still present, add new ones
          setNews(prev => {
            if (prev.length === 0) return incoming;
            const existingMap = new Map(prev.map(n => [n.link, n]));
            return incoming.map(n => {
              const existing = existingMap.get(n.link);
              // Keep existing object reference if title/link unchanged so memo skips re-render
              if (existing && existing.title === n.title) {
                return { ...existing, age: n.age };
              }
              return n;
            });
          });
        }
      }
    } catch { /* silent */ }
  }, []);

  // Visibility observer for performance
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Only fetch if visible
    if (!isVisible) return;
    
    fetchNews().then(() => setReady(true));
    const id = setInterval(fetchNews, fetchInterval);
    return () => clearInterval(id);
  }, [fetchNews, isVisible, fetchInterval]);

  // Auto-scroll + infinite loop logic (pauses when not visible)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || news.length === 0 || !isVisible) return;

    const tick = () => {
      if (!userScrollingRef.current && el && isVisible) {
        el.scrollLeft += scrollSpeed;
        // Infinite loop: when scrolled past the first set, jump back
        const half = el.scrollWidth / duplicateCount;
        if (el.scrollLeft >= half * (duplicateCount - 1)) {
          el.scrollLeft -= half;
        }
        if (el.scrollLeft <= 0) {
          el.scrollLeft += half;
        }
      }
      autoScrollRef.current = requestAnimationFrame(tick);
    };
    autoScrollRef.current = requestAnimationFrame(tick);

    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, [news, isVisible, scrollSpeed, duplicateCount]);

  // Handle user interaction — pause auto-scroll, resume after 3s idle
  const onUserScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Infinite loop snap during manual scroll too
    const section = el.scrollWidth / duplicateCount;
    if (el.scrollLeft >= section * (duplicateCount - 1)) el.scrollLeft -= section;
    if (el.scrollLeft <= 0) el.scrollLeft += section;
  }, [duplicateCount]);

  const pauseAuto = useCallback(() => {
    userScrollingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, 3000);
  }, []);

  // ── Search logic ──
  // Instant local filter as user types
  const localFiltered = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return news.filter(item => {
      const text = `${item.title} ${item.subtitle} ${item.source} ${item.category}`.toLowerCase();
      return terms.some(t => text.includes(t));
    });
  }, [searchQuery, news]);

  // Remote search (Google News + all feeds) on Enter or after 800ms idle
  const doRemoteSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/breaking-news/search?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length > 0) {
          setSearchResults(data.items.map((item: NewsItem) => ({
            ...item,
            age: getTimeAgo(item.published_at),
          })));
        } else {
          setSearchResults([]);
        }
      }
    } catch { /* silent */ }
    setSearching(false);
  }, []);

  // Debounced remote search while typing
  const onSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    searchDebounceRef.current = setTimeout(() => doRemoteSearch(value), 800);
  }, [doRemoteSearch]);

  const onSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    doRemoteSearch(searchQuery);
  }, [searchQuery, doRemoteSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchOpen(false);
  }, []);

  // Which items to display: search results > local filter > all news
  const displayItems = searchResults ?? localFiltered ?? news;
  const isSearchActive = searchQuery.trim().length > 0;

  if (!ready || news.length === 0) return null;

  const crit = displayItems.filter(n => n.urgency === "critical").length;
  const urgent = displayItems.filter(n => n.urgency === "high").length;
  const count = displayItems.length;

  return (
    <div ref={containerRef} className="w-full bg-black" style={{ minHeight: 190 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .bnt-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .bnt-scroll::-webkit-scrollbar{display:none}
        .bnt-row{display:flex;gap:12px;width:max-content}
        .bnt-card{flex-shrink:0;width:320px;display:flex;gap:10px;padding:10px;height:130px;
          border-radius:8px;border:1px solid #27272a;background:#18181b;
          text-decoration:none;color:inherit}
        .bnt-card:hover{background:#27272a}
        .bnt-img{flex-shrink:0;width:80px;border-radius:6px;overflow:hidden;
          position:relative;background:#27272a}
        .bnt-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
        .bnt-ico{flex-shrink:0;width:44px;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:2px;background:#27272a;border-radius:6px}
        .bnt-search{background:#09090b;border:1px solid #27272a;color:#fff;font-size:12px;
          padding:3px 10px;border-radius:6px;outline:none;width:0;
          transition:width .3s ease,opacity .3s ease,padding .3s ease;opacity:0}
        .bnt-search.open{width:200px;opacity:1;padding:3px 10px}
        .bnt-search:focus{border-color:#dc2626;box-shadow:0 0 0 1px rgba(220,38,38,.3)}
        .bnt-search::placeholder{color:#52525b}
      `}} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inset-0 rounded-full bg-red-500 opacity-75" />
            <span className="relative rounded-full h-2 w-2 bg-red-600" />
          </span>
          <span className="text-[11px] font-bold text-red-400 tracking-wider">LIVE</span>
          <span className="h-3 w-px bg-zinc-700" />
          {isSearchActive ? (
            <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">
              {searching ? "Searching..." : `${count} results for "${searchQuery}"`}
            </span>
          ) : (
            <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">Breaking Market News</span>
          )}
          {!isSearchActive && crit > 0 && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-600 text-white rounded animate-pulse">{crit} BREAKING</span>}
          {!isSearchActive && urgent > 0 && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded">{urgent} URGENT</span>}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <form onSubmit={onSearchSubmit} className="relative flex items-center">
            <button
              type="button"
              onClick={() => {
                if (searchOpen && searchQuery) {
                  onSearchSubmit(new Event("submit") as any);
                } else {
                  setSearchOpen(!searchOpen);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }
              }}
              className="text-zinc-500 hover:text-white transition-colors p-1 z-10"
              title="Search news"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx={11} cy={11} r={8} /><path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => onSearchInput(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              placeholder="Search news, markets, topics..."
              className={`bnt-search ${searchOpen || searchQuery ? "open" : ""}`}
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch}
                className="ml-1 text-zinc-500 hover:text-white text-xs px-1">✕</button>
            )}
          </form>
          {!isSearchActive && <span className="text-[10px] text-zinc-600">{news.length} stories</span>}
        </div>
      </div>

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
        <div style={{ position: "relative", height: 154, padding: "8px 0 0" }}>
          <div
            ref={scrollRef}
            className="bnt-scroll"
            style={{ height: "100%", paddingLeft: 12, paddingRight: 12 }}
            onScroll={onUserScroll}
            onMouseDown={pauseAuto}
            onTouchStart={pauseAuto}
            onWheel={pauseAuto}
          >
            <div className="bnt-row">
              {isSearchActive
                ? displayItems.map((item, i) => <Card key={`${item.link}-${i}`} item={item} />)
                : Array.from({ length: duplicateCount }).flatMap((_, set) =>
                    displayItems.map((item, i) => <Card key={`${set}-${i}-${item.link}`} item={item} />)
                  )
              }
            </div>
          </div>
          <div className="absolute top-0 left-0 bottom-0 w-10 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
        </div>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
    </div>
  );
}

/* ── Card is memoized — never re-renders during scroll ── */
const Card = memo(function Card({ item }: { item: NewsItem }) {
  const icon = ICONS[item.category] || "📰";
  const isCrit = item.urgency === "critical";
  const isUrg = item.urgency === "high";
  const badge = isCrit ? "BREAKING" : isUrg ? "URGENT" : item.urgency === "medium" ? "NEW" : "";
  const borderStyle = isCrit || isUrg ? "border-red-500/30" : "";

  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
       className={`bnt-card ${borderStyle}`}>
      {/* Image or icon */}
      {item.image ? (
        <div className="bnt-img">
          <img src={`/api/image-proxy?url=${encodeURIComponent(item.image)}`}
               alt="" loading="lazy" decoding="async"
               onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="absolute bottom-0 inset-x-0 bg-black/70 text-center py-px">
            <span className="text-[8px] text-zinc-400">{icon} {item.category}</span>
          </div>
        </div>
      ) : (
        <div className="bnt-ico">
          <span className="text-lg">{icon}</span>
          <span className="text-[7px] text-zinc-500 uppercase">{item.category}</span>
        </div>
      )}

      {/* Text */}
      <div className="flex flex-col justify-between min-w-0 flex-1 py-px">
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className={`px-1.5 py-px text-[8px] font-black uppercase text-white rounded-sm ${
              isCrit ? "bg-red-600 animate-pulse" : isUrg ? "bg-red-500" : "bg-yellow-600"
            }`}>{badge}</span>
          )}
          <span className="text-[9px] text-zinc-500 truncate">{item.source}</span>
          <span className="text-[9px] text-zinc-600">·</span>
          <span className={`text-[9px] ${isCrit || isUrg ? "text-red-400" : "text-zinc-500"}`}>{item.age}</span>
        </div>
        <h4 className="text-[12px] leading-4 font-semibold text-white/90 line-clamp-2 mt-1">{item.title}</h4>
        <p className="text-[10px] leading-[13px] text-zinc-500 line-clamp-1 mt-0.5">{item.subtitle}</p>
        <div className="flex justify-between mt-auto pt-0.5">
          <span className="text-[8px] text-zinc-600">
            {new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="text-[8px] text-zinc-600">Read →</span>
        </div>
      </div>
    </a>
  );
});
