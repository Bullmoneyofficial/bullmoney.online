"use client";

/**
 * UltimateHubNewsTab - Comprehensive Global News Feed for Traders
 * 
 * Features:
 * - Real-time news from crypto, stocks, forex, metals, geopolitics, economy, tech
 * - Multi-source RSS aggregation (Same sources as NewsFeedModalV2)
 * - Category filtering with visual badges
 * - Auto-refresh every 20 seconds
 * - Optimized for Ultimate Hub's neon blue styling
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Newspaper, RefreshCw, ExternalLink, TrendingUp,
  Globe, Bitcoin, BarChart3, DollarSign, 
  Gem, LineChart, Earth, Landmark, Cpu,
  Filter, Sparkles, Clock
} from "lucide-react";

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
const NEWS_REFRESH_RATE = 20000; // 20 seconds

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
  { value: "all", label: "All" },
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
  if (apiCategory && apiCategory !== "other") {
    const validCategories: MarketFilter[] = ["crypto", "stocks", "forex", "metals", "markets", "geopolitics", "economics", "tech"];
    if (validCategories.includes(apiCategory as MarketFilter)) {
      return apiCategory as MarketFilter;
    }
  }
  
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
  const sourceBoost = /coindesk|cointelegraph|reuters|investing|bloomberg|bbc|nytimes/i.test(item.source || "") ? 0.05 : 0;
  return recency * 0.6 + Math.min(1, kw / 3) * 0.35 + sourceBoost;
};

// --- OPTIMIZED IMAGE COMPONENT ---
const OptimizedNewsImage = memo(({ 
  src, 
  alt = "",
  className = "",
}: { 
  src?: string; 
  alt?: string; 
  className?: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`bg-gradient-to-br from-blue-900/20 to-black flex items-center justify-center ${className}`}>
        <Newspaper className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500/30" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
});
OptimizedNewsImage.displayName = "OptimizedNewsImage";

// --- NEWS CARD COMPONENT ---
const NewsCard = memo(({ item, preview }: { item: NewsItem; preview?: { image?: string } }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.link) {
      window.open(item.link, "_blank", "noopener,noreferrer");
    }
  };

  const categoryColors: Record<string, string> = {
    crypto: "from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-300",
    stocks: "from-emerald-500/20 to-green-600/20 border-emerald-500/30 text-emerald-300",
    forex: "from-blue-500/20 to-cyan-600/20 border-blue-500/30 text-blue-300",
    metals: "from-yellow-500/20 to-amber-600/20 border-yellow-500/30 text-yellow-300",
    geopolitics: "from-red-500/20 to-rose-600/20 border-red-500/30 text-red-300",
    economics: "from-purple-500/20 to-violet-600/20 border-purple-500/30 text-purple-300",
    tech: "from-cyan-500/20 to-blue-600/20 border-cyan-500/30 text-cyan-300",
    markets: "from-indigo-500/20 to-purple-600/20 border-indigo-500/30 text-indigo-300",
    other: "from-slate-500/20 to-zinc-600/20 border-slate-500/30 text-slate-300",
  };

  const colorClass = categoryColors[item.category || "other"] || categoryColors.other;
  const imageUrl = item.thumbnail || preview?.image;

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className="relative rounded-lg overflow-hidden cursor-pointer group bg-black border border-blue-500/20 hover:border-blue-500/40 transition-all"
      style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.1)' }}
    >
      <div className="flex gap-2 sm:gap-3 p-2 sm:p-3">
        {/* Image Thumbnail */}
        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md overflow-hidden">
          <OptimizedNewsImage
            src={imageUrl}
            alt={item.title}
            className="w-full h-full"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 sm:gap-1.5">
          {/* Header */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className={`px-1.5 py-0.5 sm:px-2 rounded-full bg-gradient-to-r ${colorClass} text-[8px] sm:text-[9px] font-bold uppercase tracking-wider border shrink-0`}>
              {item.category || "News"}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono text-blue-400/70 truncate">
              {item.source || "Unknown"}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 group-hover:text-blue-300 transition-colors leading-tight">
            {item.title}
          </h4>

          {/* Footer - Time and Read More */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-blue-400/50">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{timeAgo(item.published_at)}</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-blue-400/70 group-hover:text-blue-400 transition-colors">
              <span className="hidden sm:inline">Read</span>
              <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
NewsCard.displayName = "NewsCard";

// --- MAIN COMPONENT ---
export const UltimateHubNewsTab = memo(() => {
  const [activeMarket, setActiveMarket] = useState<MarketFilter>("all");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [previews, setPreviews] = useState<Record<string, { image?: string }>>({});
  
  const fetchingRef = React.useRef<Set<string>>(new Set());

  // Fetch link preview for images
  const fetchPreview = useCallback(async (url: string) => {
    if (fetchingRef.current.has(url) || previews[url]) return;
    fetchingRef.current.add(url);
    try {
      const r = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      const json = await r.json();
      if (json && typeof json === "object" && json.image) {
        setPreviews((prev) => ({
          ...prev,
          [url]: { image: json.image },
        }));
      }
    } catch {
      // Ignore errors
    } finally {
      fetchingRef.current.delete(url);
    }
  }, [previews]);

  // Load news data
  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/crypto-news", { cache: "no-store" });
      if (!r.ok) throw new Error(`API returned ${r.status}`);
      const json = await r.json();
      const rawItems: NewsItem[] = Array.isArray(json?.items) ? json.items : [];
      const tagged = rawItems.map((n) => ({ 
        ...n, 
        category: detectCategory(n.title || "", n.category) 
      }));
      setItems(tagged);
      setLastUpdated(new Date());
      if (tagged.length === 0) {
        setError("No news available at the moment. Try refreshing.");
      }
      if (json?.meta) {
        console.log(`[UltimateHub News] Loaded ${json.meta.total} items from ${json.meta.sources} sources`);
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

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const filtered = activeMarket === "all" 
      ? items 
      : items.filter((i) => i.category === activeMarket);
    return [...filtered].sort((a, b) => scoreItem(b) - scoreItem(a));
  }, [items, activeMarket]);

  // Prefetch previews for items without thumbnails
  useEffect(() => {
    const itemsNeedingPreviews = filteredItems
      .slice(0, 15) // Only fetch for first 15 items
      .filter(item => !item.thumbnail && item.link && !previews[item.link]);
    
    if (itemsNeedingPreviews.length === 0) return;

    let cancelled = false;
    const fetchAll = async () => {
      for (const item of itemsNeedingPreviews.slice(0, 8)) {
        if (cancelled) break;
        await fetchPreview(item.link);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [filteredItems, previews, fetchPreview]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header with Filters */}
      <div className="shrink-0 border-b border-blue-500/30 bg-black" style={{ boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)' }}>
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
              <h2 className="text-xs sm:text-sm font-bold text-blue-300" style={{ textShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6' }}>
                Global News
              </h2>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {lastUpdated && (
                <span className="text-[8px] sm:text-[9px] text-blue-400/50 font-mono hidden sm:inline">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <motion.button
                onClick={handleRefresh}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: 180 }}
                className="p-1 sm:p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30 transition-all"
                style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.3)' }}
              >
                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </motion.button>
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                  showFilters 
                    ? 'bg-blue-500/40 text-blue-200 border-blue-400/60' 
                    : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                } border`}
                style={{ boxShadow: showFilters ? '0 0 8px rgba(59, 130, 246, 0.4)' : '0 0 4px rgba(59, 130, 246, 0.3)' }}
              >
                <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </motion.button>
            </div>
          </div>

          {/* Filter Pills */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {MARKET_FILTERS.map((filter) => {
                    const Icon = FILTER_ICONS[filter.value];
                    const isActive = activeMarket === filter.value;
                    const count = filter.value === "all" 
                      ? items.length 
                      : items.filter(i => i.category === filter.value).length;

                    return (
                      <motion.button
                        key={filter.value}
                        onClick={() => setActiveMarket(filter.value)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          isActive
                            ? 'bg-blue-500/40 text-blue-200 border-blue-400/60'
                            : 'bg-blue-500/10 text-blue-400/70 border-blue-400/20 hover:bg-blue-500/20'
                        }`}
                        style={{ 
                          boxShadow: isActive 
                            ? '0 0 8px rgba(59, 130, 246, 0.4)' 
                            : '0 0 4px rgba(59, 130, 246, 0.1)' 
                        }}
                      >
                        <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">{filter.label}</span>
                        <span className="sm:hidden">{filter.label.substring(0, 3)}</span>
                        <span className="text-[8px] sm:text-[9px] opacity-70">({count})</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-blue-400/60">
            <div className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{filteredItems.length} {filteredItems.length === 1 ? 'story' : 'stories'}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Live Updates</span>
              <span className="sm:hidden">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-8 h-8 text-blue-400 mx-auto" />
              </motion.div>
              <p className="text-sm text-blue-400/70">Loading global news...</p>
            </div>
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3 p-6 border border-red-500/30 rounded-xl bg-red-500/5">
              <Newspaper className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-sm text-red-400">{error}</p>
              <motion.button
                onClick={handleRefresh}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-blue-500/30 text-blue-300 text-xs font-semibold border border-blue-400/60"
              >
                Try Again
              </motion.button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Filter className="w-8 h-8 text-blue-400/50 mx-auto" />
              <p className="text-sm text-blue-400/70">No news in this category</p>
              <motion.button
                onClick={() => setActiveMarket("all")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-blue-500/30 text-blue-300 text-xs font-semibold border border-blue-400/60"
              >
                Show All News
              </motion.button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={`${item.link}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(index * 0.03, 0.5) }}
              >
                <NewsCard item={item} preview={previews[item.link]} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
});

UltimateHubNewsTab.displayName = "UltimateHubNewsTab";
