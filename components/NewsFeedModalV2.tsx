"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type TargetAndTransition } from "framer-motion";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { 
  Newspaper, X, ChevronDown, TrendingUp, 
  Globe, Bitcoin, BarChart3, DollarSign, 
  Gem, LineChart, Earth, Landmark, Cpu 
} from "lucide-react";
import { ShimmerLine, ShimmerBorder } from "@/components/ui/UnifiedShimmer";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";
import { trackEvent } from "@/lib/analytics";

// --- UTILS ---
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- OPTIMIZED IMAGE COMPONENT ---
const OptimizedNewsImage = memo(({ 
  src, 
  alt = "",
  className = "",
  aspectRatio = "aspect-video",
  priority = false,
  onLoad,
}: { 
  src?: string; 
  alt?: string; 
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
  onLoad?: () => void;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current || !src) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = src;
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src, priority]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  if (!src || error) {
    return (
      <div className={cn("bg-gradient-to-br from-white/20 to-black flex items-center justify-center", aspectRatio, className)}>
        <Newspaper className="w-8 h-8 text-white/30" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-neutral-900", aspectRatio, className)}>
      {/* Skeleton placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={priority ? src : undefined}
        data-src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          willChange: loaded ? 'auto' : 'opacity',
          contentVisibility: 'auto',
        }}
      />
    </div>
  );
});
OptimizedNewsImage.displayName = "OptimizedNewsImage";

// --- TYPES ---
type MarketFilter = "all" | "crypto" | "stocks" | "forex" | "metals" | "markets" | "geopolitics" | "economics" | "tech";

type NewsItem = {
  title: string;
  link: string;
  source?: string;
  published_at?: string;
  category?: MarketFilter | string;
  description?: string;
  thumbnail?: string;
};

type LinkPreview = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

// --- CONSTANTS ---
const MARKET_KEYWORDS = {
  crypto: ["bitcoin", "btc", "ethereum", "eth", "solana", "binance", "crypto", "doge", "xrp", "defi", "blockchain", "coinbase", "web3", "nft", "altcoin"],
  stocks: ["nasdaq", "dow", "s&p", "tesla", "apple", "microsoft", "amazon", "nvidia", "stock", "earnings", "ipo", "equity", "shares", "wall street", "nyse"],
  forex: ["eurusd", "gbpusd", "usdjpy", "audusd", "usdchf", "forex", "currency", "exchange rate", "dollar", "euro", "yen", "pound"],
  metals: ["gold", "silver", "platinum", "palladium", "metal", "commodity", "precious", "oil", "copper", "mining", "crude", "natural gas", "brent"],
  markets: ["market", "trading", "investors", "portfolio", "hedge", "etf", "mutual fund", "bonds", "treasury", "yield"],
  geopolitics: ["war", "conflict", "sanctions", "geopolitical", "military", "russia", "china", "ukraine", "middle east", "tension", "nato"],
  economics: ["fed", "federal reserve", "inflation", "interest rate", "gdp", "unemployment", "recession", "central bank", "ecb", "monetary"],
  tech: ["ai", "artificial intelligence", "tech", "semiconductor", "chips", "software", "startup", "silicon valley", "innovation"],
} as const;

const ALL_KEYWORDS = Object.values(MARKET_KEYWORDS).flat();
const NEWS_REFRESH_RATE = 20000;

// Icon map for filters
const FILTER_ICONS: Record<MarketFilter, React.ComponentType<{ className?: string }>> = {
  all: Globe,
  crypto: Bitcoin,
  stocks: BarChart3,
  forex: DollarSign,
  metals: Gem,
  markets: LineChart,
  geopolitics: Earth,
  economics: Landmark,
  tech: Cpu,
};

const MARKET_FILTERS: { value: MarketFilter; label: string }[] = [
  { value: "all", label: "All News" },
  { value: "crypto", label: "Crypto" },
  { value: "stocks", label: "Stocks" },
  { value: "forex", label: "Forex" },
  { value: "metals", label: "Commodities" },
  { value: "markets", label: "Markets" },
  { value: "geopolitics", label: "World" },
  { value: "economics", label: "Economy" },
  { value: "tech", label: "Tech" },
];

// --- HELPER FUNCTIONS ---
const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const s = Math.floor((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const detectCategory = (title: string, apiCategory?: string): MarketFilter | "other" => {
  // If the API already provided a category, use it directly
  if (apiCategory && apiCategory !== "other") {
    const validCategories: MarketFilter[] = ["crypto", "stocks", "forex", "metals", "markets", "geopolitics", "economics", "tech"];
    if (validCategories.includes(apiCategory as MarketFilter)) {
      return apiCategory as MarketFilter;
    }
  }
  
  // Otherwise, detect from title keywords
  const lower = title.toLowerCase();
  for (const [category, words] of Object.entries(MARKET_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return category as MarketFilter;
  }
  return "other";
};

const scoreItem = (item: NewsItem) => {
  const now = Date.now();
  const t = item.published_at ? Date.parse(item.published_at) : now - 1000 * 60 * 60 * 48;
  const hours = Math.max(1, (now - t) / (1000 * 60 * 60));
  const recency = Math.max(0, 1 - Math.log2(hours + 1) / 8);
  const title = (item.title || "").toLowerCase();
  let kw = 0;
  for (const k of ALL_KEYWORDS) if (title.includes(k)) kw += 1;
  const sourceBoost = /coindesk|cointelegraph|reuters|investing|bloomberg/i.test(item.source || "") ? 0.05 : 0;
  return recency * 0.6 + Math.min(1, kw / 3) * 0.35 + sourceBoost;
};

// --- MODAL CONTEXT ---
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error("useModalState must be used within NewsFeedModalV2");
  return context;
};

// --- NEWS CARD COMPONENT ---
const NewsCard = memo(({ 
  item, 
  preview,
  featured = false,
  onPreviewClick,
  shouldSkipHeavyEffects = false,
  isMobile = false,
}: { 
  item: NewsItem;
  preview?: LinkPreview;
  featured?: boolean;
  onPreviewClick: (url: string) => void;
  shouldSkipHeavyEffects?: boolean;
  isMobile?: boolean;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.link) {
      window.open(item.link, "_blank", "noopener,noreferrer");
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.link) {
      onPreviewClick(item.link);
    }
  };

  const categoryColors: Record<string, string> = {
    crypto: "from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-300",
    stocks: "from-white/20 to-white/20 border-white/30 text-white",
    forex: "from-white/20 to-white/20 border-white/30 text-white",
    metals: "from-yellow-500/20 to-amber-600/20 border-yellow-500/30 text-yellow-300",
    other: "from-slate-500/20 to-zinc-600/20 border-slate-500/30 text-slate-300",
    all: "from-indigo-500/20 to-white/20 border-indigo-500/30 text-indigo-300",
  };

  const colorClass = categoryColors[item.category || "other"] || categoryColors.other;

  if (featured) {
    return (
      <motion.div
        whileHover={shouldSkipHeavyEffects || isMobile ? {} : { scale: 1.01 }}
        onClick={handleClick}
        className="relative rounded-xl overflow-hidden cursor-pointer group"
        style={{
          background: "linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.9))",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Image */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden">
          <OptimizedNewsImage
            src={preview?.image}
            alt={item.title}
            aspectRatio="aspect-auto"
            priority={true}
            className={cn(
              "w-full h-full",
              !shouldSkipHeavyEffects && "transition-transform duration-300 group-hover:scale-105"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

          {/* Preview Button */}
          <button
            onClick={handlePreviewClick}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-white/30 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/30 transition-all z-10"
          >
            Preview
          </button>

          {/* Category Badge */}
          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gradient-to-r ${colorClass} text-[10px] font-bold uppercase tracking-widest border backdrop-blur-sm`}>
            {item.category || "Market"}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">
              {item.source || "News"}
            </span>
            {item.published_at && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-[10px] font-mono text-white/70">{timeAgo(item.published_at)}</span>
              </>
            )}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-white transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-2 mb-4">
            {preview?.description || "Click to read the full story."}
          </p>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
            Read Full Story
            <IconExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={shouldSkipHeavyEffects || isMobile ? {} : { scale: 1.02, y: -2 }}
      whileTap={shouldSkipHeavyEffects || isMobile ? {} : { scale: 0.98 }}
      onClick={handleClick}
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: "linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.8))",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden">
          <OptimizedNewsImage
            src={preview?.image}
            alt={item.title}
            aspectRatio="aspect-square"
            className={cn(
              "w-full h-full rounded-lg",
              !shouldSkipHeavyEffects && "transition-transform duration-200 group-hover:scale-110"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${colorClass} text-[8px] font-bold uppercase tracking-widest border`}>
              {item.category || "News"}
            </span>
            <span className="text-[10px] font-mono text-slate-500">{timeAgo(item.published_at)}</span>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-white transition-colors">
            {item.title}
          </h4>
          <p className="text-[11px] text-slate-500 font-mono">{item.source || "Unknown Source"}</p>
        </div>
      </div>
    </motion.div>
  );
});
NewsCard.displayName = "NewsCard";

// --- MAIN CONTENT COMPONENT ---
const NewsFeedContent = memo(() => {
  const { setIsOpen } = useModalState();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();

  const [activeMarket, setActiveMarket] = useState<MarketFilter>("all");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [displayCount, setDisplayCount] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [previews, setPreviews] = useState<Record<string, LinkPreview>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchingRef = useRef<Set<string>>(new Set());

  // Load news data
  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/crypto-news", { cache: "no-store" });
      if (!r.ok) throw new Error(`API returned ${r.status}`);
      const json = await r.json();
      const rawItems: NewsItem[] = Array.isArray(json?.items) ? json.items : [];
      // Use API category if provided, otherwise detect from title
      const tagged = rawItems.map((n) => ({ 
        ...n, 
        category: detectCategory(n.title || "", n.category) 
      }));
      setItems(tagged);
      setLastUpdated(new Date());
      if (tagged.length === 0) {
        setError("No news available at the moment. Try refreshing.");
      }
      // Log metadata if available
      if (json?.meta) {
        console.log(`[NewsFeed] Loaded ${json.meta.total} items from ${json.meta.sources} sources`);
      }
    } catch (err: any) {
      console.error("News fetch error:", err);
      setError(err?.message || "Failed to load news");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews, refreshKey]);

  useEffect(() => {
    const id = setInterval(loadNews, NEWS_REFRESH_RATE);
    return () => clearInterval(id);
  }, [loadNews]);

  // Fetch link preview
  const fetchPreview = useCallback(async (url: string) => {
    if (fetchingRef.current.has(url) || previews[url]) return;
    fetchingRef.current.add(url);
    try {
      const r = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      const json = await r.json();
      if (json && typeof json === "object") {
        setPreviews((prev) => ({
          ...prev,
          [url]: {
            url,
            title: json.title,
            description: json.description,
            image: json.image,
            siteName: json.siteName,
          },
        }));
      }
    } catch {
      // Ignore errors
    } finally {
      fetchingRef.current.delete(url);
    }
  }, [previews]);

  // Filter and sort items
  const { featured, topStories, rest, totalCount } = useMemo(() => {
    const filtered = activeMarket === "all" 
      ? items 
      : items.filter((i) => i.category === activeMarket);
    const ranked = [...filtered].sort((a, b) => scoreItem(b) - scoreItem(a));
    return {
      featured: ranked[0] || null,
      topStories: ranked.slice(1, 5),
      rest: ranked.slice(5, 5 + displayCount),
      totalCount: filtered.length,
    };
  }, [items, activeMarket, displayCount]);

  // Prefetch previews for visible items
  useEffect(() => {
    const urls = [
      featured?.link,
      ...topStories.map((n) => n.link),
      ...rest.slice(0, 8).map((n) => n.link),
    ].filter(Boolean) as string[];

    const missing = urls.filter((url) => !previews[url]);
    if (missing.length === 0) return;

    let cancelled = false;
    const fetchAll = async () => {
      for (const url of missing.slice(0, 10)) {
        if (cancelled) break;
        await fetchPreview(url);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [featured, topStories, rest, previews, fetchPreview]);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    setIsOpen(false);
  }, [setIsOpen]);

  const handleRefresh = useCallback(() => {
    SoundEffects.click();
    setRefreshKey((p) => p + 1);
  }, []);

  const handleFilterChange = useCallback((filter: MarketFilter) => {
    SoundEffects.click();
    setActiveMarket(filter);
    setDisplayCount(10);
    trackEvent("news_filter_change", { filter });
  }, []);

  const activePreview = previewUrl ? previews[previewUrl] : null;

  return (
    <motion.div
      initial={animations.modalBackdrop.initial}
      animate={animations.modalBackdrop.animate as TargetAndTransition}
      exit={animations.modalBackdrop.exit}
      transition={animations.modalBackdrop.transition}
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-5 sm:p-6 bg-black/95 ${
        shouldDisableBackdropBlur ? "" : "backdrop-blur-md"
      }`}
      onClick={handleClose}
    >
      {/* Tap to close hints */}
      {!shouldSkipHeavyEffects && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
          >
            <span>↑</span> Tap anywhere to close <span>↑</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
          >
            <span>↓</span> Tap anywhere to close <span>↓</span>
          </motion.div>
        </>
      )}

      {/* Modal */}
      <motion.div
        initial={animations.modalContent.initial}
        animate={animations.modalContent.animate as TargetAndTransition}
        exit={animations.modalContent.exit}
        transition={animations.modalContent.transition}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl"
      >
        {/* Shimmer Border */}
        {!shouldSkipHeavyEffects && (
          <div className="absolute inset-[-2px] overflow-hidden rounded-2xl pointer-events-none z-0">
            <ShimmerBorder color="blue" intensity="low" />
          </div>
        )}

        {/* Inner Container */}
        <div className="relative z-10 bg-gradient-to-b from-neutral-900 to-black rounded-2xl border border-white/30 overflow-hidden max-h-[90vh] flex flex-col">
          {!shouldSkipHeavyEffects && <ShimmerLine color="blue" />}

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/40 to-white/30 border border-white/40 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">BullMoney News</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-full w-full bg-white"></span>
                    </span>
                    Live Feed
                  </span>
                  {lastUpdated && (
                    <span className="hidden sm:inline text-[10px] text-slate-500 font-mono">
                      Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={shouldSkipHeavyEffects || isMobile ? {} : { scale: 1.05, rotate: 180 }}
                whileTap={shouldSkipHeavyEffects ? {} : { scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                title="Refresh"
              >
                <IconRefresh className={cn("w-4 h-4", loading && "animate-spin")} />
              </motion.button>
              <motion.button
                whileHover={shouldSkipHeavyEffects || isMobile ? {} : { scale: 1.1 }}
                whileTap={shouldSkipHeavyEffects ? {} : { scale: 0.95 }}
                onClick={handleClose}
                className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors group relative"
                title="Close (ESC)"
                data-modal-close="true"
              >
                <X className="w-5 h-5" />
                {!shouldSkipHeavyEffects && (
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ESC
                  </span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Filter Bar - Horizontal scrollable on mobile */}
          <div className="p-3 border-b border-white/20 flex-shrink-0 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              {MARKET_FILTERS.map(({ value, label }) => {
                const Icon = FILTER_ICONS[value];
                return (
                  <button
                    key={value}
                    onClick={() => handleFilterChange(value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap",
                      activeMarket === value
                        ? "bg-gradient-to-r from-white to-white text-white shadow-lg shadow-white/25"
                        : "bg-neutral-800/50 border border-white/20 text-slate-400 hover:border-white/50 hover:text-white"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
              <span className="ml-auto text-[10px] font-mono text-slate-500 self-center hidden md:block">
                {totalCount} articles
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Error State */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-300 font-semibold mb-2">{error}</p>
                <p className="text-sm text-slate-500 mb-4">The feed may have timed out. Try refreshing.</p>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg text-sm font-bold transition-colors"
                >
                  <IconRefresh className="w-4 h-4" />
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                <div className="h-64 rounded-xl bg-neutral-800/50 animate-pulse" />
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-neutral-800/50 animate-pulse" />
                  ))}
                </div>
              </div>
            )}

            {/* News Content */}
            {!error && !loading && (
              <div className="space-y-6">
                {/* Featured Article */}
                {featured && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-4 h-4 text-white" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Featured Story</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
                    </div>
                    <NewsCard
                      item={featured}
                      preview={previews[featured.link]}
                      featured
                      onPreviewClick={setPreviewUrl}
                      shouldSkipHeavyEffects={shouldSkipHeavyEffects}
                      isMobile={isMobile}
                    />
                  </div>
                )}

                {/* Top Stories */}
                {topStories.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Newspaper className="w-4 h-4 text-white" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Top Stories</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {topStories.map((item, i) => (
                        <NewsCard
                          key={`${item.link}-${i}`}
                          item={item}
                          preview={previews[item.link]}
                          onPreviewClick={setPreviewUrl}
                          shouldSkipHeavyEffects={shouldSkipHeavyEffects}
                          isMobile={isMobile}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* More Stories */}
                {rest.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">More Headlines</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-slate-500/30 to-transparent" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {rest.map((item, i) => (
                        <NewsCard
                          key={`${item.link}-rest-${i}`}
                          item={item}
                          preview={previews[item.link]}
                          onPreviewClick={setPreviewUrl}
                          shouldSkipHeavyEffects={shouldSkipHeavyEffects}
                          isMobile={isMobile}
                        />
                      ))}
                    </div>

                    {/* Load More */}
                    {totalCount > 5 + displayCount && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => {
                            SoundEffects.click();
                            setDisplayCount((c) => c + 10);
                          }}
                          className="px-6 py-2 rounded-lg bg-neutral-800/50 border border-white/30 text-sm font-bold text-white hover:bg-white/20 hover:border-white/50 transition-all"
                        >
                          Load More ({totalCount - 5 - displayCount} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!featured && topStories.length === 0 && rest.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Newspaper className="w-12 h-12 text-slate-600 mb-4" />
                    <p className="text-slate-500">No news found for this filter.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Preview Panel */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <motion.div
              initial={shouldSkipHeavyEffects ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
              animate={shouldSkipHeavyEffects ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={shouldSkipHeavyEffects ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
              transition={shouldSkipHeavyEffects ? { duration: 0.15 } : { type: "spring", damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl h-[80vh] overflow-hidden rounded-2xl bg-black border-2 border-white/40"
              style={shouldSkipHeavyEffects ? {} : { boxShadow: "0 0 60px rgba(255, 255, 255, 0.3)" }}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/20 bg-neutral-900">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Article Preview</div>
                  <div className="truncate text-sm font-semibold text-white">
                    {activePreview?.siteName || activePreview?.title || "Loading..."}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Open Full Article
                  </a>
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="h-[calc(100%-60px)] relative">
                {/* Loading indicator */}
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-0">
                  <div className="flex flex-col items-center gap-3">
                    <IconRefresh className="w-6 h-6 text-white animate-spin" />
                    <span className="text-xs text-slate-500">Loading preview...</span>
                  </div>
                </div>
                <iframe
                  title="Article Preview"
                  src={previewUrl}
                  className="w-full h-full bg-white relative z-10"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  loading="lazy"
                />
              </div>

              {/* CSP Notice */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-neutral-900/90 backdrop-blur-sm border-t border-white/20">
                <p className="text-[10px] text-slate-500 text-center">
                  Some sites block iframe previews. Use &ldquo;Open Full Article&rdquo; if content doesn&apos;t load.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
NewsFeedContent.displayName = "NewsFeedContent";

// --- TRIGGER BUTTON ---
const NewsFeedTrigger = memo(() => {
  const { setIsOpen } = useModalState();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
    trackEvent("modal_open", { modal: "news_feed" });
  }, [setIsOpen]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
    trackEvent("modal_open", { modal: "news_feed" });
  }, [setIsOpen]);

  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleTouch}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full h-full absolute inset-0 cursor-pointer bg-transparent border-0 outline-none z-[100]"
      style={{
        background: "transparent",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
      aria-label="Open News Feed"
    />
  );
});
NewsFeedTrigger.displayName = "NewsFeedTrigger";

// --- MAIN MODAL EXPORT ---
export const NewsFeedModalV2 = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC key support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      <NewsFeedTrigger />
      {createPortal(
        <AnimatePresence>
          {isOpen && <NewsFeedContent />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
NewsFeedModalV2.displayName = "NewsFeedModalV2";

// --- STANDALONE BUTTON VERSION (for use outside overlay triggers) ---
export const NewsFeedButton = memo(({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClick = useCallback(() => {
    SoundEffects.click();
    setIsOpen(true);
    trackEvent("modal_open", { modal: "news_feed" });
  }, []);

  if (!mounted) return null;

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
          "bg-gradient-to-r from-white/50 to-white/50",
          "border border-white/60 text-sm font-bold text-white",
          "hover:from-white/70 hover:to-white/70 transition-all",
          className
        )}
        style={{ boxShadow: "0 0 16px rgba(255, 255, 255, 0.4)" }}
      >
        <Newspaper className="w-5 h-5" />
        Open News Feed
      </button>
      {createPortal(
        <AnimatePresence>
          {isOpen && <NewsFeedContent />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
NewsFeedButton.displayName = "NewsFeedButton";

export default NewsFeedModalV2;
