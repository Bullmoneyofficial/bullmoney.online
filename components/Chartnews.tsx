"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, memo, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent, trackClick } from "@/lib/analytics";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { ChevronDown, ChartBar, Newspaper, X, ArrowRight } from "lucide-react";
import { useComponentTracking } from "@/lib/CrashTracker";
import { useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";
import { NewsFeedButton } from "@/components/NewsFeedModalV2";

// --- UTILS ---
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- HOOK: DEVICE CHECK ---
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768); 
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    return isMobile;
};

// --- GLOBAL STYLES (Neon Blue Sign Style) ---
const GLOBAL_STYLES = `
  @keyframes neon-pulse {
    0%, 100% { 
      text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
      filter: brightness(1);
    }
    50% { 
      text-shadow: 0 0 6px #ffffff, 0 0 12px #ffffff;
      filter: brightness(1.1);
    }
  }

  @keyframes neon-glow {
    0%, 100% { 
      box-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px #ffffff;
    }
    50% { 
      box-shadow: 0 0 6px #ffffff, 0 0 12px #ffffff, inset 0 0 6px #ffffff;
    }
  }

  .neon-blue-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
    animation: neon-pulse 2s ease-in-out infinite;
  }

  .neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }

  .neon-white-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-border {
    border: 2px solid #ffffff;
    box-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px #ffffff;
    animation: neon-glow 2s ease-in-out infinite;
  }

  .neon-blue-bg {
    background: #ffffff;
    box-shadow: 0 0 8px #ffffff, 0 0 16px #ffffff;
  }

  .gpu-layer {
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
`;

// ==========================================
// NEON BORDER COMPONENT
// ==========================================

interface NeonBorderProps {
    children: ReactNode;
    className?: string;
    borderRadius?: string;
}

const NeonBorder = ({ 
    children, 
    className, 
    borderRadius = 'rounded-xl'
}: NeonBorderProps) => {
    return (
        <div className={cn("relative neon-blue-border", borderRadius, className)}>
            {children}
        </div>
    );
};

// ==========================================
// HELPER TIP COMPONENT (NEW)
// ==========================================

const HelperTip = ({ label, className }: { label: string; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 5, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 5, scale: 0.9 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={cn("absolute z-50 flex flex-col items-center pointer-events-none", className)}
  >
    {/* The Bubble */}
    <div className="relative px-3 py-1 bg-black rounded-full flex items-center justify-center neon-blue-border">
        <span className="neon-white-text text-[10px] font-bold whitespace-nowrap">
            {label}
        </span>
    </div>
    {/* The Triangle Pointer (pointing down) */}
    <div className="w-2 h-2 bg-black rotate-45 -translate-y-[4px] relative z-10 neon-blue-border" />
  </motion.div>
);

// Mobile-optimized HelperTip that skips on low-end devices
const MobileOptimizedHelperTip = ({ label, className, shouldSkipHeavyEffects }: { label: string; className?: string; shouldSkipHeavyEffects: boolean }) => {
  if (shouldSkipHeavyEffects) return null;
  return <HelperTip label={label} className={className} />;
};

/* --------------------------- OPTIMIZED HIGH AESTHETIC CARD --------------------------- */

const HighAestheticCard = memo(({ 
    title, 
    subtitle, 
    icon: Icon, 
    onShow, 
    isChart = false,
    showTip = false,
    tipLabel = "Click Here",
    shouldSkipHeavyEffects = false
}: { 
    title: string, 
    subtitle: string, 
    icon: React.ComponentType<{ className?: string }>, 
    onShow: () => void,
    isChart?: boolean,
    showTip?: boolean,
    tipLabel?: string,
    shouldSkipHeavyEffects?: boolean
}) => {
    const isMobile = useIsMobile();

    return (
        <motion.div
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl py-12 md:py-16 cursor-pointer gpu-layer bg-black"
            initial={{ opacity: 0, y: shouldSkipHeavyEffects ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={shouldSkipHeavyEffects ? {} : { scale: isMobile ? 1.0 : 1.01 }}
            whileTap={shouldSkipHeavyEffects ? {} : { scale: 0.99 }}
            onClick={onShow}
        >
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                {/* TIP FOR CARD ICON/TITLE - skip on mobile */}
                {!shouldSkipHeavyEffects && (
                  <AnimatePresence>
                      {showTip && isChart && (
                           <HelperTip label={tipLabel} className="-top-8" />
                      )}
                  </AnimatePresence>
                )}

                <div className={cn("flex h-16 w-16 items-center justify-center rounded-xl bg-black mb-4", shouldSkipHeavyEffects ? "border border-white/50" : "neon-blue-border")}>
                    <Icon className={cn("h-8 w-8 text-white", shouldSkipHeavyEffects ? "" : "neon-white-icon")} />
                </div>

                <h2 className={cn("mt-2 text-3xl font-black tracking-tight md:text-4xl", shouldSkipHeavyEffects ? "text-white" : "neon-blue-text")}>
                    {title}
                </h2>
                
                <p className={cn("mt-2 text-sm max-w-sm px-4", shouldSkipHeavyEffects ? "text-white" : "neon-blue-text")}>
                    {subtitle}
                </p>

                <div className="mt-8 relative">
                    {/* TIP FOR LAUNCH BUTTON - skip on mobile */}
                    {!shouldSkipHeavyEffects && (
                      <AnimatePresence>
                          {showTip && !isChart && (
                               <HelperTip label={tipLabel} className="-top-12 left-1/2 -translate-x-1/2" />
                          )}
                      </AnimatePresence>
                    )}

                    {shouldSkipHeavyEffects ? (
                      <div className="relative z-10 flex items-center gap-2 rounded-full px-8 py-3 text-lg font-bold bg-white transition-all duration-300 group hover:brightness-110">
                          <span className="text-black">Launch Terminal</span>
                          <ArrowRight className="h-4 w-4 text-black transition-transform group-hover:translate-x-1" />
                      </div>
                    ) : (
                      <NeonBorder borderRadius="rounded-full">
                          <div className="relative z-10 flex items-center gap-2 rounded-full px-8 py-3 text-lg font-bold neon-blue-bg transition-all duration-300 group hover:brightness-110">
                              <span className="neon-white-text">Launch Terminal</span>
                              <ArrowRight className="h-4 w-4 neon-white-text transition-transform group-hover:translate-x-1" />
                          </div>
                      </NeonBorder>
                    )}
                </div>
            </div>
        </motion.div>
    );
});
HighAestheticCard.displayName = "HighAestheticCard";


/* --------------------------- DATA CONFIG --------------------------- */
const CHARTS = [
  { label: "Crypto Markets", category: "crypto", tabConfig: [{ title: "Crypto", symbols: [{ s: "BINANCE:BTCUSDT", d: "BTC / USDT" }, { s: "BINANCE:ETHUSDT", d: "ETH / USDT" }, { s: "BINANCE:SOLUSDT", d: "SOL / USDT" }, { s: "BINANCE:XRPUSDT", d: "XRP / USDT" }, { s: "BINANCE:DOGEUSDT", d: "DOGE / USDT" }] }] },
  { label: "Stock Markets", category: "stocks", tabConfig: [{ title: "US Stocks", symbols: [{ s: "NASDAQ:AAPL", d: "Apple" }, { s: "NASDAQ:MSFT", d: "Microsoft" }, { s: "NASDAQ:TSLA", d: "Tesla" }, { s: "NASDAQ:AMZN", d: "Amazon" }, { s: "NASDAQ:NVDA", d: "NVIDIA" }] }] },
  { label: "Forex Markets", category: "forex", tabConfig: [{ title: "Forex", symbols: [{ s: "FX:EURUSD", d: "EUR / USD" }, { s: "FX:GBPUSD", d: "GBP / USD" }, { s: "FX:USDJPY", d: "USD / JPY" }, { s: "FX:AUDUSD", d: "AUD / USD" }, { s: "FX:USDCHF", d: "USD / CHF" }] }] },
  { label: "Metals", category: "metals", tabConfig: [{ title: "Metals", symbols: [{ s: "TVC:GOLD", d: "Gold" }, { s: "TVC:SILVER", d: "Silver" }, { s: "TVC:PLATINUM", d: "Platinum" }, { s: "TVC:PALLADIUM", d: "Palladium" }] }] },
];

/* --------------------------- TRADINGVIEW WIDGET --------------------------- */
const TradingViewMarketOverview = memo(({ height = 560, tabs }: { height?: number; tabs: any }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const currentScript = ref.current.querySelector("script");
    const newConfig = JSON.stringify(tabs);

    if (currentScript && currentScript.getAttribute('data-config') === newConfig) return; 

    ref.current.innerHTML = ""; 

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.setAttribute('data-config', newConfig); 
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: false , // Transparent to blend with bg
      width: "100%",
      height,
      dateRange: "1D",
      showChart: true,
      showSymbolLogo: true,
      locale: "en",
      tabs,
    });
    ref.current.appendChild(script);

  }, [height, tabs]); 

  return (
    <div ref={ref} className="w-full bg-[#030712] rounded-xl overflow-hidden border border-white/5" style={{ minHeight: height }}>
      <div className="tradingview-widget-container__widget" style={{ height }} />
    </div>
  );
});
TradingViewMarketOverview.displayName = "TradingViewMarketOverview";

/* --------------------------- CHART SECTION --------------------------- */
export const TradingViewDropdown = memo(({ onMarketChange, showTip }: { onMarketChange?: (v: string) => void, showTip?: boolean }) => {
  const [selected, setSelected] = useState(CHARTS[0]!);
  const [open, setOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const isMobile = useIsMobile();
  const { shouldSkipHeavyEffects, shouldDisableBackdropBlur } = useMobilePerformance();
  const chartHeight = isMobile ? 300 : 680;

  const handleSelect = useCallback((chart: any) => {
    setSelected(chart);
    setOpen(false);
    onMarketChange?.(chart.category);
  }, [onMarketChange]);

  if (!selected) return null;

  return (
    <div className={cn("relative mx-auto w-full max-w-screen-xl rounded-3xl bg-black p-4 md:p-6", shouldSkipHeavyEffects ? "border border-white/50" : "neon-blue-border")}>
      {!showChart && (
        <HighAestheticCard
            title="Show Live Market Charts"
            subtitle="Real-time institutional grade data visualization."
            icon={ChartBar}
            onShow={() => setShowChart(true)}
            isChart={true}
            showTip={showTip && !shouldSkipHeavyEffects}
            tipLabel="Open Charts"
            shouldSkipHeavyEffects={shouldSkipHeavyEffects}
        />
      )}

      <AnimatePresence mode="wait">
        {showChart && (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: shouldSkipHeavyEffects ? 0 : 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldSkipHeavyEffects ? 0 : -30 }}
            transition={{ duration: shouldSkipHeavyEffects ? 0.15 : 0.4 }}
            className={shouldSkipHeavyEffects ? "" : "will-change-transform"}
          >
            <div className="mb-4 flex items-center justify-between">
                {shouldSkipHeavyEffects ? (
                  <button
                    onClick={() => setOpen((p) => !p)}
                    className="group relative flex items-center gap-3 rounded-full bg-black px-6 py-2 text-sm font-semibold text-white border border-white/50"
                  >
                    <span className="relative z-10">{selected.label}</span>
                    <ChevronDown className={`h-4 w-4 relative z-10 text-white transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <NeonBorder borderRadius="rounded-full">
                      <button
                        onClick={() => setOpen((p) => !p)}
                        className="group relative flex items-center gap-3 rounded-full bg-black px-6 py-2 text-sm font-semibold neon-white-text"
                      >
                        <span className="relative z-10">{selected.label}</span>
                        <ChevronDown className={`h-4 w-4 relative z-10 neon-blue-text transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                      </button>
                  </NeonBorder>
                )}
            </div>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: shouldSkipHeavyEffects ? 0 : -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldSkipHeavyEffects ? 0 : -10 }}
                  transition={{ duration: shouldSkipHeavyEffects ? 0.1 : 0.2 }}
                  className={cn("absolute z-20 mt-2 w-64 overflow-hidden rounded-xl bg-black", shouldSkipHeavyEffects ? "border border-white/50" : "neon-blue-border")}
                >
                  {CHARTS.map((chart, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(chart)}
                      className={cn(
                        "block w-full px-4 py-3 text-left text-sm transition-all duration-200",
                        shouldSkipHeavyEffects 
                          ? (selected.label === chart.label ? "text-black bg-white font-bold" : "text-white hover:text-white")
                          : cn("neon-blue-text hover:neon-white-text", selected.label === chart.label && "neon-white-text neon-blue-bg font-bold")
                      )}
                    >
                      {chart.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className={cn("relative mt-4 w-full rounded-2xl bg-black p-1 md:p-2", shouldSkipHeavyEffects ? "border border-white/50" : "neon-blue-border")} style={{ minHeight: chartHeight }}>
              <TradingViewMarketOverview height={chartHeight} tabs={selected.tabConfig} />
            </div>

            <div className="mt-6 flex justify-center">
                <button
                    onClick={() => { setOpen(false); setShowChart(false); }}
                    className={cn("text-xs uppercase tracking-widest transition-colors py-2", shouldSkipHeavyEffects ? "text-white hover:text-white" : "neon-blue-text hover:neon-white-text")}
                >
                    Close Chart Viewer
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
TradingViewDropdown.displayName = "TradingViewDropdown";

/* --------------------------- NEWS FEED LOGIC --------------------------- */
type MarketFilter = "all" | "crypto" | "stocks" | "forex" | "metals";
type NewsItem = { title: string; link: string; source?: string; published_at?: string; category?: MarketFilter | "other"; };

type LinkPreview = {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
};

const MARKET_KEYWORDS = {
  crypto: ["bitcoin", "btc", "ethereum", "eth", "solana", "binance", "crypto", "doge", "xrp", "defi", "blockchain"],
  stocks: ["nasdaq", "dow", "s&p", "tesla", "apple", "microsoft", "amazon", "nvidia", "stock", "earnings", "ipo"],
  forex: ["eurusd", "gbpusd", "usdjpy", "audusd", "usdchf", "forex", "currency", "exchange rate", "federal reserve"],
  metals: ["gold", "silver", "platinum", "palladium", "metal", "commodity", "precious", "oil"],
} as const;

const ALL_KEYWORDS = Object.values(MARKET_KEYWORDS).flat();

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

const detectCategory = (title: string): MarketFilter | "other" => {
  const lower = title.toLowerCase();
  for (const [category, words] of Object.entries(MARKET_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return category as MarketFilter;
  }
  return "other";
};

const score = (item: NewsItem) => {
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

/* --------------------------- NEWS FEED CONTENT --------------------------- */
const NewsFeedContent = memo(({ activeMarket, onClose }: { activeMarket: MarketFilter, onClose: () => void }) => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [count, setCount] = useState<number>(10);
    const [refreshKey, setRefreshKey] = useState(0);
    const [previews, setPreviews] = useState<Record<string, LinkPreview>>({});
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const NEWS_REFRESH_RATE = 20000;

    // ESC key support
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]); 

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch("/api/crypto-news", { cache: "no-store" });
            if (!r.ok) {
                throw new Error(`API returned ${r.status}`);
            }
            const json = await r.json();
            const rawItems: NewsItem[] = Array.isArray(json?.items) ? json.items : [];
            const tagged = rawItems.map((n) => ({ ...n, category: detectCategory(n.title || "") }));
            setItems(tagged);
            setLastUpdated(new Date());
            if (tagged.length === 0) {
                setError("No news available at the moment. Try refreshing.");
            }
        } catch (err: any) {
            console.error("News fetch error:", err);
            setError(err?.message || "Failed to load news");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load, refreshKey]);

    useEffect(() => {
        const id = setInterval(load, NEWS_REFRESH_RATE);
        return () => clearInterval(id);
    }, [load]);

    const { top5, rest, allItemsCount } = useMemo(() => {
        const filtered = activeMarket === "all" ? items : items.filter((i) => i.category === activeMarket);
        const ranked = [...filtered].sort((a, b) => score(b) - score(a));
        return {
            top5: ranked.slice(0, 5),
            rest: ranked.slice(5, 5 + count),
            allItemsCount: filtered.length,
        };
    }, [items, activeMarket, count]);

    const marketTitle = activeMarket === "all" ? "Global Feed" : activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1) + " News";

    const featured = top5[0];
    const secondaryTop = top5.slice(1);

    const isBreaking = useMemo(() => {
        if (!featured) return false;
        const t = featured.published_at ? Date.parse(featured.published_at) : NaN;
        const isRecent = Number.isFinite(t) ? Date.now() - t < 1000 * 60 * 60 : false; // < 1h
        const title = (featured.title || "").toLowerCase();
        const isUrgentWord = /breaking|urgent|alert|flash/.test(title);
        return isRecent || isUrgentWord;
    }, [featured]);

    const tickerItems = useMemo(() => {
        const merged = [...top5, ...rest];
        const uniq: NewsItem[] = [];
        const seen = new Set<string>();
        for (const n of merged) {
            const k = n.link || n.title;
            if (!k || seen.has(k)) continue;
            seen.add(k);
            uniq.push(n);
            if (uniq.length >= 12) break;
        }
        return uniq;
    }, [top5, rest]);

    // Track in-flight requests to prevent duplicates
    const fetchingRef = useRef<Set<string>>(new Set());

    const fetchPreview = useCallback(async (url: string) => {
        // Deduplicate: skip if already fetching or already have data
        if (fetchingRef.current.has(url)) return;
        
        fetchingRef.current.add(url);
        try {
            // Use default cache behavior to leverage HTTP cache-control headers
            const r = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            const json = await r.json();
            if (!json || typeof json !== "object") return;
            const p: LinkPreview = {
                url,
                title: typeof (json as any).title === "string" ? (json as any).title : undefined,
                description: typeof (json as any).description === "string" ? (json as any).description : undefined,
                image: typeof (json as any).image === "string" ? (json as any).image : undefined,
                siteName: typeof (json as any).siteName === "string" ? (json as any).siteName : undefined,
            };
            setPreviews((prev) => ({ ...prev, [url]: p }));
        } catch {
            // ignore
        } finally {
            fetchingRef.current.delete(url);
        }
    }, []);

    // Prefetch previews for currently visible stories (featured, top stories, first N in feed)
    useEffect(() => {
        const links = Array.from(
            new Set(
                [featured?.link, ...secondaryTop.map((n) => n.link), ...rest.slice(0, 12).map((n) => n.link)].filter(Boolean) as string[]
            )
        );
        if (links.length === 0) return;
        const missing = links.filter((l) => !previews[l]);
        if (missing.length === 0) return;

        let cancelled = false;
        const run = async () => {
            // light concurrency (avoid hammering)
            const queue = missing.slice(0, 14);
            const workers = Array.from({ length: 3 }).map(async () => {
                while (!cancelled && queue.length) {
                    const next = queue.shift();
                    if (!next) return;
                    await fetchPreview(next);
                }
            });
            await Promise.allSettled(workers);
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [featured?.link, secondaryTop, rest, previews, fetchPreview]);

    const sources = useMemo(() => {
        const filtered = activeMarket === "all" ? items : items.filter((i) => i.category === activeMarket);
        const counts = new Map<string, number>();
        for (const n of filtered) {
            const s = (n.source || "Unknown").trim();
            counts.set(s, (counts.get(s) || 0) + 1);
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
    }, [items, activeMarket]);

    const trendingKeywords = useMemo(() => {
        const merged = [...top5, ...rest];
        const counts = new Map<string, number>();
        for (const n of merged) {
            const title = (n.title || "").toLowerCase();
            for (const kw of ALL_KEYWORDS) {
                if (title.includes(kw)) counts.set(kw, (counts.get(kw) || 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([kw]) => kw.toUpperCase());
    }, [top5, rest]);

    const activePreview = previewUrl ? previews[previewUrl] : undefined;

    return (
        <div className="relative flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-black" data-lenis-prevent>
            {/* Masthead (mini news site header) */}
            <div className="shrink-0 neon-blue-border bg-black">
                <div className="flex items-center justify-between px-4 md:px-6 py-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black neon-blue-border">
                                <Newspaper className="h-5 w-5 text-white neon-white-icon" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-black tracking-tight truncate max-w-[220px] sm:max-w-none neon-blue-text">BULLMONEY NEWSROOM</span>
                                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500 neon-blue-border">Live</span>
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest neon-blue-text">
                                    <span>{marketTitle}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:inline">Institutional headlines</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <span className="hidden md:block text-xs neon-blue-text font-mono">
                                Updated {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={() => setRefreshKey((p) => p + 1)}
                            className="group relative rounded-full p-2 transition-colors hover:bg-white/5"
                            aria-label="Refresh news"
                            title="Refresh"
                        >
                            <IconRefresh className={cn("h-4 w-4 neon-blue-text group-hover:neon-white-text", loading && "animate-spin")} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClose();
                            }}
                            className="relative rounded-full p-2.5 neon-white-text neon-blue-border bg-black transition-all hover:brightness-110"
                            aria-label="Close news feed"
                            title="Close (ESC)"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Category strip (visual only; filtering still driven by dashboard selection) */}
                <div className="px-4 md:px-6 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {(["all", "crypto", "stocks", "forex", "metals"] as MarketFilter[]).map((m) => {
                            const active = m === activeMarket;
                            const label = m === "all" ? "Top" : m;
                            return (
                                <span
                                    key={m}
                                    className={cn(
                                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                                        active
                                            ? "neon-blue-bg neon-white-text"
                                            : "bg-black neon-blue-text neon-blue-border"
                                    )}
                                >
                                    {label}
                                </span>
                            );
                        })}
                        <span className="ml-auto hidden md:inline text-[10px] font-mono uppercase tracking-widest neon-blue-text">
                            Filter controlled by dashboard
                        </span>
                    </div>
                </div>

                {/* Breaking banner */}
                {!error && featured && isBreaking && (
                    <div className="px-4 md:px-6 pb-3">
                        <div className="relative overflow-hidden rounded-xl neon-blue-border bg-black">
                            <div className="relative flex items-center gap-3 px-3 py-2">
                                <span className="relative inline-flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" style={{ boxShadow: '0 0 6px rgba(239,68,68,.5)' }} />
                                </span>
                                <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">Breaking</span>
                                <a
                                    href={featured.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="min-w-0 flex-1 truncate text-xs font-semibold neon-white-text hover:brightness-110"
                                >
                                    {featured.title}
                                </a>
                                <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-widest neon-blue-text">
                                    {timeAgo(featured.published_at) || "NOW"}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPreviewUrl(featured.link);
                                    }}
                                    className="shrink-0 rounded-full neon-blue-border bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest neon-white-text hover:brightness-110"
                                >
                                    Preview
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ticker */}
                {!error && (
                    <div className="neon-blue-border bg-black">
                        <div className="flex items-center gap-3 px-4 md:px-6 py-2">
                            <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-red-300">Urgent Wire</span>
                            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.3) 0%, transparent 100%)' }} />
                        </div>
                        <div className="overflow-hidden px-4 md:px-6 pb-3">
                            <div className="whitespace-nowrap text-xs neon-blue-text">
                                {loading ? (
                                    <span className="font-mono">Loading headlines…</span>
                                ) : (
                                    tickerItems.map((n, i) => (
                                        <a
                                            key={`${n.link}-${i}`}
                                            href={n.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mr-4 inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 neon-blue-border hover:neon-white-text transition"
                                        >
                                            <span className="text-[10px] font-mono">{timeAgo(n.published_at) || "NOW"}</span>
                                            <span className="max-w-[40ch] truncate">{n.title}</span>
                                        </a>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div
                className="flex-1 min-h-0 overflow-y-auto bg-black/90 custom-scrollbar overscroll-contain md:overscroll-auto"
                data-lenis-prevent
            >
                {/* Error State */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-4 neon-blue-border">
                            <X className="h-8 w-8 text-red-500" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
                        </div>
                        <p className="text-red-300 font-semibold">{error}</p>
                        <p className="mt-1 text-sm neon-blue-text">The feed can time out. Refresh to try again.</p>
                        <button
                            onClick={() => setRefreshKey((p) => p + 1)}
                            className="mt-5 inline-flex items-center gap-2 px-4 py-2 neon-blue-bg neon-white-text rounded-lg hover:brightness-110 transition-colors text-sm font-black"
                        >
                            <IconRefresh className="h-4 w-4" />
                            Retry
                        </button>
                    </div>
                )}

                {!error && (
                    <div className="p-4 md:p-6">
                        <div className="grid gap-6 lg:grid-cols-12">
                            {/* Main column */}
                            <div className="lg:col-span-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest neon-blue-text">Featured</h3>
                                    <div className="h-px w-1/2 ml-4 hidden md:block" style={{ background: 'linear-gradient(90deg, #ffffff 0%, transparent 100%)', boxShadow: '0 0 4px #ffffff' }} />
                                </div>

                                <div className="mt-3">
                                    {loading ? (
                                        <div className="h-40 md:h-52 animate-pulse rounded-2xl bg-black neon-blue-border" />
                                    ) : !featured ? (
                                        <div className="rounded-2xl neon-blue-border bg-black p-6 text-center neon-blue-text">
                                            No featured story available.
                                        </div>
                                    ) : (
                                        <a
                                            href={featured.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block overflow-hidden rounded-2xl neon-blue-border bg-black hover:brightness-110 transition"
                                        >
                                            <div className="relative">
                                                {previews[featured.link]?.image ? (
                                                    <img
                                                        src={previews[featured.link]?.image}
                                                        alt=""
                                                        className="h-44 w-full object-cover opacity-85"
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="h-44 w-full bg-black animate-pulse" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setPreviewUrl(featured.link);
                                                    }}
                                                    className="absolute right-3 top-3 z-10 rounded-full neon-blue-border bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest neon-white-text hover:brightness-110"
                                                >
                                                    Preview
                                                </button>
                                            </div>
                                            <div className="p-5 md:p-6">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full neon-blue-bg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest neon-white-text">
                                                        {(featured.category || "Market").toString()}
                                                    </span>
                                                    <span className="text-[10px] font-mono uppercase tracking-widest neon-blue-text">
                                                        {featured.source || "Unknown"}
                                                    </span>
                                                    {featured.published_at && (
                                                        <span className="text-[10px] font-mono uppercase tracking-widest neon-blue-text">• {timeAgo(featured.published_at)}</span>
                                                    )}
                                                </div>
                                                <h2 className="mt-3 text-lg md:text-2xl font-black tracking-tight neon-blue-text group-hover:neon-white-text transition-colors">
                                                    {featured.title}
                                                </h2>
                                                <p className="mt-2 text-sm neon-blue-text line-clamp-2">
                                                    {previews[featured.link]?.description || "Click to open full story."}
                                                </p>
                                                <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest neon-blue-text">
                                                    Read story
                                                    <IconExternalLink className="h-3.5 w-3.5" />
                                                </div>
                                            </div>
                                        </a>
                                    )}
                                </div>

                                {/* Top stories */}
                                <div className="mt-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest neon-blue-text">Top Stories</h3>
                                        <div className="h-px w-1/2 ml-4 hidden md:block" style={{ background: 'linear-gradient(90deg, #ffffff 0%, transparent 100%)', boxShadow: '0 0 4px #ffffff' }} />
                                    </div>

                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        {loading
                                            ? Array.from({ length: 4 }).map((_, i) => (
                                                  <div key={i} className="h-24 animate-pulse rounded-xl bg-black neon-blue-border" />
                                              ))
                                            : secondaryTop.length === 0
                                              ? <div className="rounded-xl neon-blue-border bg-black p-6 text-center neon-blue-text">No top stories.</div>
                                              : secondaryTop.map((item, i) => (
                                                    <a
                                                        key={`${item.link}-${i}`}
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group rounded-xl bg-black p-4 neon-blue-border transition hover:brightness-110 duration-200"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="shrink-0 w-24">
                                                                {previews[item.link]?.image ? (
                                                                    <img
                                                                        src={previews[item.link]?.image}
                                                                        alt=""
                                                                        className="h-16 w-24 rounded-lg object-cover neon-blue-border"
                                                                        loading="lazy"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <div className="h-16 w-24 rounded-lg bg-black neon-blue-border animate-pulse" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-[9px] font-black uppercase tracking-widest neon-blue-text">
                                                                    {item.source || "Unknown"} • {(item.category || "Market").toString()}
                                                                </div>
                                                                <div className="mt-2 line-clamp-2 text-sm font-semibold neon-blue-text group-hover:neon-white-text transition-colors">
                                                                    {item.title}
                                                                </div>
                                                                <p className="mt-1 text-xs neon-blue-text line-clamp-2">
                                                                    {previews[item.link]?.description || ""}
                                                                </p>
                                                            </div>
                                                            <div className="shrink-0 flex flex-col items-end gap-2">
                                                                <div className="text-[10px] font-mono neon-blue-text">{timeAgo(item.published_at)}</div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setPreviewUrl(item.link);
                                                                    }}
                                                                    className="rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest neon-white-text neon-blue-border hover:brightness-110"
                                                                >
                                                                    Preview
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))}
                                    </div>
                                </div>

                                {/* Latest feed */}
                                <div className="mt-6 overflow-hidden rounded-2xl neon-blue-border bg-black">
                                    <div className="sticky top-0 z-10 bg-black px-4 py-3 neon-blue-border">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest neon-blue-text">Latest Feed ({allItemsCount})</h3>
                                            <select
                                                value={count}
                                                onChange={(e) => setCount(Number(e.target.value))}
                                                className="rounded-lg bg-black px-2 py-1 text-[10px] neon-blue-text neon-blue-border outline-none uppercase font-black"
                                            >
                                                {[5, 10, 20, 50].map((n) => (
                                                    <option key={n} value={n}>
                                                        {n}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <ul className="divide-y divide-black">
                                        {loading &&
                                            Array.from({ length: 8 }).map((_, i) => (
                                                <li key={i} className="animate-pulse p-4">
                                                    <div className="h-3 w-1/3 rounded bg-black" />
                                                    <div className="mt-2 h-4 w-2/3 rounded bg-black" />
                                                </li>
                                            ))}
                                        {!loading && rest.length === 0 && <li className="p-10 text-center neon-blue-text">No additional news items</li>}
                                        {!loading &&
                                            rest.map((n, i) => (
                                                <li key={`${n.link}-${i}`} className="group px-4 py-3 transition hover:bg-white/[0.03]">
                                                    <div className="flex items-start gap-3">
                                                        <span className="mt-2 h-2 w-2 rounded-full neon-blue-bg group-hover:brightness-110 transition-colors" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start gap-3">
                                                                <div className="hidden sm:block shrink-0">
                                                                    {previews[n.link]?.image ? (
                                                                        <img
                                                                            src={previews[n.link]?.image}
                                                                            alt=""
                                                                            className="h-12 w-16 rounded-lg object-cover neon-blue-border"
                                                                            loading="lazy"
                                                                            referrerPolicy="no-referrer"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-12 w-16 rounded-lg bg-black neon-blue-border" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 group/link w-full">
                                                                        <h3 className="truncate text-sm font-semibold neon-blue-text group-hover/link:neon-white-text transition-colors">{n.title}</h3>
                                                                        <IconExternalLink className="mt-1 h-3 w-3 neon-blue-text opacity-0 transition group-hover/link:opacity-100" />
                                                                    </a>
                                                                    <p className="mt-1 text-xs neon-blue-text line-clamp-2">
                                                                        {previews[n.link]?.description || ""}
                                                                    </p>
                                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] neon-blue-text font-mono uppercase">
                                                                        {previews[n.link]?.siteName && <span>{previews[n.link]?.siteName}</span>}
                                                                        {n.source && <span>{previews[n.link]?.siteName ? "•" : ""} {n.source}</span>}
                                                                        {n.category && n.category !== "other" && <span>• {n.category}</span>}
                                                                        {n.published_at && <time dateTime={n.published_at}>• {timeAgo(n.published_at)}</time>}
                                                                    </div>
                                                                </div>
                                                                <div className="shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setPreviewUrl(n.link);
                                                                        }}
                                                                        className="rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest neon-white-text neon-blue-border hover:brightness-110"
                                                                    >
                                                                        Preview
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] neon-blue-text font-mono uppercase">
                                                                {n.source && <span>{n.source}</span>}
                                                                {n.category && n.category !== "other" && <span>• {n.category}</span>}
                                                                {n.published_at && <time dateTime={n.published_at}>• {timeAgo(n.published_at)}</time>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="lg:col-span-4">
                                <div className="space-y-4">
                                    <div className="rounded-2xl neon-blue-border bg-black p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest neon-blue-text">Market Pulse</h3>
                                            <span className="text-[10px] font-mono neon-blue-text">{allItemsCount} items</span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <div className="rounded-xl bg-black p-3 neon-blue-border">
                                                <div className="text-[10px] font-mono uppercase tracking-widest neon-blue-text">Top</div>
                                                <div className="mt-1 text-sm font-black neon-white-text">{top5.length}</div>
                                            </div>
                                            <div className="rounded-xl bg-black p-3 neon-blue-border">
                                                <div className="text-[10px] font-mono uppercase tracking-widest neon-blue-text">Shown</div>
                                                <div className="mt-1 text-sm font-black neon-white-text">{Math.min(count + 5, allItemsCount)}</div>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs neon-blue-text">
                                            Stories are ranked by recency + keyword relevance.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl neon-blue-border bg-black p-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest neon-blue-text">Sources</h3>
                                        <div className="mt-3 space-y-2">
                                            {loading ? (
                                                <div className="h-20 animate-pulse rounded-xl bg-black neon-blue-border" />
                                            ) : (
                                                sources.map(([s, c]) => (
                                                    <div key={s} className="flex items-center justify-between rounded-xl bg-black px-3 py-2 neon-blue-border">
                                                        <span className="text-xs font-semibold neon-blue-text truncate">{s}</span>
                                                        <span className="text-[10px] font-mono neon-blue-text">{c}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl neon-blue-border bg-black p-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest neon-blue-text">Trending</h3>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {loading ? (
                                                Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-black neon-blue-border" />
                                                ))
                                            ) : trendingKeywords.length === 0 ? (
                                                <span className="text-xs neon-blue-text">No trend setups.</span>
                                            ) : (
                                                trendingKeywords.map((w) => (
                                                    <span key={w} className="rounded-full neon-blue-bg px-3 py-1 text-[10px] font-black uppercase tracking-widest neon-white-text">
                                                        {w}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mini website preview drawer */}
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        key="news-preview-drawer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50"
                    >
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setPreviewUrl(null)}
                        />

                        <motion.div
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 40, opacity: 0 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                            className="absolute right-0 top-0 h-full w-full md:w-[48%] bg-black border-l border-white/10"
                            data-lenis-prevent
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-black/60 backdrop-blur">
                                <div className="min-w-0">
                                    <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Mini Preview</div>
                                    <div className="truncate text-sm font-semibold text-white">
                                        {activePreview?.siteName || activePreview?.title || "Article"}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={previewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-200 ring-1 ring-white/10 hover:ring-sky-500/30"
                                    >
                                        Open
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewUrl(null)}
                                        className="rounded-full bg-white/5 p-2 text-white ring-1 ring-white/10 hover:ring-sky-500/30"
                                        aria-label="Close preview"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="h-[calc(100%-52px)] p-3">
                                <div className="h-full overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/[0.02]">
                                    <iframe
                                        title="News preview"
                                        src={previewUrl}
                                        className="h-full w-full"
                                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                    />
                                </div>
                                <p className="mt-2 text-[10px] text-neutral-600 font-mono uppercase tracking-widest">
                                    Some sites block iframe previews (CSP/X-Frame-Options). Use “Open” if blank.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
NewsFeedContent.displayName = "NewsFeedContent";


/* --------------------------- MAIN EXPORT --------------------------- */

export function CTA() {
  const [activeMarket, setActiveMarket] = useState<any>("all");
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  // Cycle through the tips: 0 = News, 1 = Charts, 2 = None (pause)
  useEffect(() => {
    const interval = setInterval(() => {
        setActiveTipIndex(prev => (prev + 1) % 3);
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

    return (
        <div id="market-dashboard" className="w-full full-bleed viewport-full overflow-x-hidden bg-black px-0 md:px-8 py-10">
      <style>{GLOBAL_STYLES}</style>
            <div className="mx-auto w-full xl:max-w-none px-4 md:px-0">
        <header className="text-center mb-12">
           
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter neon-blue-text">
                MARKET DASHBOARD
            </h1>
            <p className="mt-4 text-sm neon-blue-text md:text-base max-w-2xl mx-auto">
                Real-time institutional grade data covering <span className="neon-white-text">Crypto</span>, <span className="neon-white-text">Stocks</span>, <span className="neon-white-text">Forex</span>, and <span className="neon-white-text">Metals</span>.
            </p>
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neon-blue-border bg-black neon-blue-text text-[10px] font-mono tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full neon-blue-bg opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full neon-blue-bg"></span>
                </span>
                System Online
            </div>
        </header>
        
        <div className="mt-10 flex justify-center">
          {/* Tip Index 0: News - Using new V2 Modal */}
          <NewsFeedButton className="w-full max-w-xl" />
        </div>

                <div className="mt-10 flex justify-center">
          {/* Tip Index 1: Charts */}
          <TradingViewDropdown onMarketChange={setActiveMarket} showTip={activeTipIndex === 1} />
        </div>
      </div>
    </div>
  );
}
export default CTA;