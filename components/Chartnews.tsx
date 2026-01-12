"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, memo, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { ChevronDown, ChartBar, Newspaper, X, ArrowRight } from "lucide-react";

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

// --- GLOBAL STYLES (Includes Shimmer Animations) ---
const GLOBAL_STYLES = `
  @keyframes gradient-xy {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes float-particle {
    0% { transform: translateY(0) scale(1); opacity: 0.4; }
    50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
    100% { transform: translateY(0) scale(1); opacity: 0.4; }
  }
  @keyframes text-shimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: -200% 50%; }
  }

  .animate-gradient-xy {
    animation: gradient-xy 15s ease infinite;
    background-size: 200% 200%;
  }
  .animate-float-slow {
    animation: float-particle 6s ease-in-out infinite;
  }
  
  /* CYBER BLUE TEXT SHIMMER (Sky -> White -> Indigo) */
  .animate-text-shimmer {
    background: linear-gradient(
      110deg, 
      #38bdf8 20%,   /* Sky 400 */
      #ffffff 48%,   /* White Peak */
      #818cf8 52%,   /* Indigo 400 */
      #38bdf8 80%    /* Sky 400 */
    );
    background-size: 200% auto;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: text-shimmer 3s linear infinite;
  }

  .gpu-layer {
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
`;

// ==========================================
// SHIMMER BORDER COMPONENT
// ==========================================

// Matches the Sky/Indigo Theme
const shimmerGradient = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #38bdf8 50%, #00000000 100%)";

interface ShimmerBorderProps {
    children: ReactNode;
    className?: string;
    borderRadius?: string; 
    borderWidth?: string; 
    speed?: number;
    colorOverride?: string;
    innerClassName?: string;
}

const ShimmerBorder = ({ 
    children, 
    className, 
    borderRadius = 'rounded-xl', 
    borderWidth = 'inset-[2px]', 
    speed = 3, 
    colorOverride, 
    innerClassName 
}: ShimmerBorderProps) => {
    const finalGradient = colorOverride || shimmerGradient;
    
    return (
        <div className={cn("relative overflow-hidden group/shimmer", borderRadius, className)}>
            {/* Layer 1: The Spinning Gradient - pointer-events-none so it doesn't block clicks */}
            <motion.div
                className="absolute inset-[-100%] pointer-events-none" 
                animate={{ rotate: 360 }}
                transition={{ 
                    duration: speed, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                style={{ background: finalGradient }}
            />

            {/* Layer 2: Inner Mask - pointer-events-none so it doesn't block clicks */}
            <div className={cn("absolute bg-neutral-950 flex items-center justify-center z-10 pointer-events-none", borderRadius, borderWidth, innerClassName)}>
            </div>
            
            {/* Content - ensure pointer events work */}
            <div className="relative z-20 h-full w-full pointer-events-auto">
                {children}
            </div>
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
    <div className="relative p-[1.5px] overflow-hidden rounded-full shadow-lg shadow-sky-500/20">
        <motion.div 
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: shimmerGradient }}
        />
        <div className="relative z-10 px-3 py-1 bg-[#020611] rounded-full flex items-center justify-center border border-sky-500/20">
            <span className="text-sky-100 text-[10px] font-bold whitespace-nowrap">
                {label}
            </span>
        </div>
    </div>
    {/* The Triangle Pointer (pointing down) */}
    <div className="w-2 h-2 bg-[#020611] rotate-45 -translate-y-[4px] relative z-10 border-b border-r border-sky-500/20" />
  </motion.div>
);

/* --------------------------- OPTIMIZED HIGH AESTHETIC CARD --------------------------- */

const Particle = memo(({ delay }: { delay: number }) => (
    <div 
        className="absolute h-[2px] w-[2px] rounded-full bg-sky-400/60 animate-float-slow"
        style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${4 + Math.random() * 4}s`
        }}
    />
));
Particle.displayName = "Particle";

const HighAestheticCard = memo(({ 
    title, 
    subtitle, 
    icon: Icon, 
    onShow, 
    isChart = false,
    showTip = false, // Added prop
    tipLabel = "Click Here" // Added prop
}: { 
    title: string, 
    subtitle: string, 
    icon: React.ElementType, 
    onShow: () => void,
    isChart?: boolean,
    showTip?: boolean,
    tipLabel?: string
}) => {
    const isMobile = useIsMobile();
    
    const particles = useMemo(() => Array.from({ length: 12 }).map((_, i) => (
        <Particle key={i} delay={Math.random() * 2} />
    )), []);

    return (
        <motion.div
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl py-12 md:py-16 cursor-pointer gpu-layer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: isMobile ? 1.0 : 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onShow}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e1b4b] opacity-90 animate-gradient-xy" />

            {!isMobile && (
                <>
                    <div className="absolute inset-0 opacity-30 blur-3xl bg-[radial-gradient(circle_at_50%_60%,rgba(56,189,248,0.3),transparent_60%)] animate-float-slow" />
                    <div className="absolute inset-0 pointer-events-none">{particles}</div>
                </>
            )}

            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                {/* TIP FOR CARD ICON/TITLE */}
                <AnimatePresence>
                    {showTip && isChart && (
                         <HelperTip label={tipLabel} className="-top-8" />
                    )}
                </AnimatePresence>

                <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/50 mb-4 shadow-[0_0_20px_rgba(56,189,248,0.3)] ${!isChart && !isMobile ? "animate-float-slow" : ""}`}>
                    <Icon className="h-8 w-8" />
                </div>

                <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl animate-text-shimmer">
                    {title}
                </h2>
                
                <p className="mt-2 text-sm text-sky-200/60 max-w-sm px-4">
                    {subtitle}
                </p>

                <div className="mt-8 relative">
                    {/* TIP FOR LAUNCH BUTTON */}
                    <AnimatePresence>
                        {showTip && !isChart && (
                             <HelperTip label={tipLabel} className="-top-12 left-1/2 -translate-x-1/2" />
                        )}
                    </AnimatePresence>

                    <ShimmerBorder borderRadius="rounded-full" borderWidth="inset-[2px]" speed={3}>
                        <div className="relative z-10 flex items-center gap-2 rounded-full px-8 py-3 text-lg font-bold text-white 
                                    shadow-[0_0_25px_rgba(56,189,248,0.25)] 
                                    bg-neutral-900/80 transition-all duration-300 group hover:bg-neutral-900">
                            <span className="animate-text-shimmer bg-[length:200%_auto]">Launch Terminal</span>
                            <ArrowRight className="h-4 w-4 text-sky-400 transition-transform group-hover:translate-x-1" />
                        </div>
                    </ShimmerBorder>
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
  const chartHeight = isMobile ? 300 : 560;

  const handleSelect = useCallback((chart: any) => {
    setSelected(chart);
    setOpen(false);
    onMarketChange?.(chart.category);
  }, [onMarketChange]);

  if (!selected) return null;

  return (
    <div className="relative mx-auto w-full max-w-screen-xl rounded-3xl border border-white/5 bg-black/40 p-4 md:p-6 shadow-2xl backdrop-blur-sm">
      {!showChart && (
        <HighAestheticCard
            title="Show Live Market Charts"
            subtitle="Real-time institutional grade data visualization."
            icon={ChartBar}
            onShow={() => setShowChart(true)}
            isChart={true}
            showTip={showTip} // Pass tip prop
            tipLabel="Open Charts"
        />
      )}

      <AnimatePresence mode="wait">
        {showChart && (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="will-change-transform"
          >
            <div className="mb-4 flex items-center justify-between">
                <ShimmerBorder borderRadius="rounded-full" borderWidth="inset-[2px]" speed={2}>
                    <button
                      onClick={() => setOpen((p) => !p)}
                      className="group relative flex items-center gap-3 rounded-full bg-neutral-950 px-6 py-2 text-sm font-semibold text-white shadow-lg transition"
                    >
                      <span className="relative z-10 animate-text-shimmer">{selected.label}</span>
                      <ChevronDown className={`h-4 w-4 relative z-10 text-sky-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                    </button>
                </ShimmerBorder>
            </div>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-20 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
                >
                  {CHARTS.map((chart, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(chart)}
                      className={cn(
                        "block w-full px-4 py-3 text-left text-sm text-neutral-400 transition-all duration-200 hover:text-white hover:bg-white/5",
                        selected.label === chart.label && "text-sky-400 bg-sky-900/20 font-bold"
                      )}
                    >
                      {chart.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative mt-4 w-full rounded-2xl border border-white/10 bg-neutral-950 p-1 md:p-2" style={{ minHeight: chartHeight }}>
              <TradingViewMarketOverview height={chartHeight} tabs={selected.tabConfig} />
            </div>

            <div className="mt-6 flex justify-center">
                <button
                    onClick={() => { setOpen(false); setShowChart(false); }}
                    className="text-xs text-neutral-500 hover:text-white uppercase tracking-widest transition-colors py-2"
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

    const fetchPreview = useCallback(async (url: string) => {
        try {
            const r = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`, { cache: "no-store" });
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
        <div className="relative flex h-full max-h-full flex-col overflow-hidden rounded-2xl bg-black">
            {/* Masthead (mini news site header) */}
            <div className="shrink-0 border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 md:px-6 py-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 ring-1 ring-sky-500/20">
                                <Newspaper className="h-5 w-5 text-sky-400" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-black tracking-tight text-white truncate max-w-[220px] sm:max-w-none animate-text-shimmer">BULLMONEY NEWSROOM</span>
                                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500 border border-red-500/20">Live</span>
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                                    <span className="text-sky-400/90">{marketTitle}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:inline">Institutional headlines</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <span className="hidden md:block text-xs text-neutral-600 font-mono">
                                Updated {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={() => setRefreshKey((p) => p + 1)}
                            className="group relative rounded-full p-2 transition-colors hover:bg-white/5"
                            aria-label="Refresh news"
                            title="Refresh"
                        >
                            <IconRefresh className={cn("h-4 w-4 text-neutral-500 group-hover:text-white", loading && "animate-spin")} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClose();
                            }}
                            className="relative rounded-full p-2.5 text-white bg-white/5 transition-all hover:bg-white/10 border border-white/10"
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
                                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1",
                                        active
                                            ? "bg-sky-500/15 text-sky-300 ring-sky-500/30"
                                            : "bg-white/[0.03] text-neutral-500 ring-white/10"
                                    )}
                                >
                                    {label}
                                </span>
                            );
                        })}
                        <span className="ml-auto hidden md:inline text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                            Filter controlled by dashboard
                        </span>
                    </div>
                </div>

                {/* Ticker */}
                {!error && (
                    <div className="border-t border-white/5 bg-black/60">
                        <div className="flex items-center gap-3 px-4 md:px-6 py-2">
                            <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-neutral-500">Ticker</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-sky-500/20 to-transparent" />
                        </div>
                        <div className="overflow-hidden px-4 md:px-6 pb-3">
                            <div className="whitespace-nowrap text-xs text-neutral-300">
                                {loading ? (
                                    <span className="text-neutral-600 font-mono">Loading headlines…</span>
                                ) : (
                                    tickerItems.map((n, i) => (
                                        <a
                                            key={`${n.link}-${i}`}
                                            href={n.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mr-4 inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1 ring-1 ring-white/10 hover:ring-sky-500/30 hover:text-white transition"
                                        >
                                            <span className="text-[10px] font-mono text-neutral-500">{timeAgo(n.published_at) || "NOW"}</span>
                                            <span className="max-w-[40ch] truncate">{n.title}</span>
                                        </a>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto bg-black/90 scrollbar-hide">
                {/* Error State */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 ring-1 ring-red-500/20">
                            <X className="h-8 w-8 text-red-500" />
                        </div>
                        <p className="text-red-300 font-semibold">{error}</p>
                        <p className="mt-1 text-sm text-neutral-500">The feed can time out. Refresh to try again.</p>
                        <button
                            onClick={() => setRefreshKey((p) => p + 1)}
                            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-sky-500/15 text-sky-300 rounded-lg hover:bg-sky-500/20 transition-colors text-sm font-black ring-1 ring-sky-500/20"
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
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Featured</h3>
                                    <div className="h-px w-1/2 bg-gradient-to-r from-sky-500/20 to-transparent ml-4 hidden md:block" />
                                </div>

                                <div className="mt-3">
                                    {loading ? (
                                        <div className="h-40 md:h-52 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10" />
                                    ) : !featured ? (
                                        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-6 text-center text-neutral-500">
                                            No featured story available.
                                        </div>
                                    ) : (
                                        <a
                                            href={featured.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] ring-1 ring-white/10 hover:ring-sky-500/30 transition"
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
                                                    <div className="h-44 w-full bg-white/[0.03] animate-pulse" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setPreviewUrl(featured.link);
                                                    }}
                                                    className="absolute right-3 top-3 z-10 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white ring-1 ring-white/20 hover:bg-white/15"
                                                >
                                                    Preview
                                                </button>
                                            </div>
                                            <div className="p-5 md:p-6">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-sky-300 ring-1 ring-sky-500/20">
                                                        {(featured.category || "Market").toString()}
                                                    </span>
                                                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                                                        {featured.source || "Unknown"}
                                                    </span>
                                                    {featured.published_at && (
                                                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">• {timeAgo(featured.published_at)}</span>
                                                    )}
                                                </div>
                                                <h2 className="mt-3 text-lg md:text-2xl font-black tracking-tight text-white group-hover:text-sky-200 transition-colors">
                                                    {featured.title}
                                                </h2>
                                                <p className="mt-2 text-sm text-neutral-400 line-clamp-2">
                                                    {previews[featured.link]?.description || "Click to open full story."}
                                                </p>
                                                <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-sky-300">
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
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Top Stories</h3>
                                        <div className="h-px w-1/2 bg-gradient-to-r from-sky-500/20 to-transparent ml-4 hidden md:block" />
                                    </div>

                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        {loading
                                            ? Array.from({ length: 4 }).map((_, i) => (
                                                  <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10" />
                                              ))
                                            : secondaryTop.length === 0
                                              ? <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-6 text-center text-neutral-500">No top stories.</div>
                                              : secondaryTop.map((item, i) => (
                                                    <a
                                                        key={`${item.link}-${i}`}
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group rounded-xl bg-[#0a0a0a] p-4 ring-1 ring-white/5 transition hover:ring-sky-500/30 hover:-translate-y-0.5 duration-200"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="shrink-0 w-24">
                                                                {previews[item.link]?.image ? (
                                                                    <img
                                                                        src={previews[item.link]?.image}
                                                                        alt=""
                                                                        className="h-16 w-24 rounded-lg object-cover ring-1 ring-white/10"
                                                                        loading="lazy"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <div className="h-16 w-24 rounded-lg bg-white/[0.03] ring-1 ring-white/10 animate-pulse" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-[9px] font-black uppercase tracking-widest text-neutral-500">
                                                                    {item.source || "Unknown"} • {(item.category || "Market").toString()}
                                                                </div>
                                                                <div className="mt-2 line-clamp-2 text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors">
                                                                    {item.title}
                                                                </div>
                                                                <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                                                                    {previews[item.link]?.description || ""}
                                                                </p>
                                                            </div>
                                                            <div className="shrink-0 flex flex-col items-end gap-2">
                                                                <div className="text-[10px] font-mono text-neutral-600">{timeAgo(item.published_at)}</div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setPreviewUrl(item.link);
                                                                    }}
                                                                    className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-200 ring-1 ring-white/10 hover:ring-sky-500/30"
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
                                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                                    <div className="sticky top-0 z-10 bg-black/80 px-4 py-3 border-b border-white/10 backdrop-blur">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Latest Feed ({allItemsCount})</h3>
                                            <select
                                                value={count}
                                                onChange={(e) => setCount(Number(e.target.value))}
                                                className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-neutral-300 ring-1 ring-white/10 outline-none uppercase font-black"
                                            >
                                                {[5, 10, 20, 50].map((n) => (
                                                    <option key={n} value={n}>
                                                        {n}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <ul className="divide-y divide-white/5">
                                        {loading &&
                                            Array.from({ length: 8 }).map((_, i) => (
                                                <li key={i} className="animate-pulse p-4">
                                                    <div className="h-3 w-1/3 rounded bg-white/5" />
                                                    <div className="mt-2 h-4 w-2/3 rounded bg-white/5" />
                                                </li>
                                            ))}
                                        {!loading && rest.length === 0 && <li className="p-10 text-center text-neutral-500">No additional news items</li>}
                                        {!loading &&
                                            rest.map((n, i) => (
                                                <li key={`${n.link}-${i}`} className="group px-4 py-3 transition hover:bg-white/[0.03]">
                                                    <div className="flex items-start gap-3">
                                                        <span className="mt-2 h-2 w-2 rounded-full bg-sky-500/50 shadow-[0_0_10px_rgba(56,189,248,.55)] group-hover:bg-sky-400 transition-colors" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start gap-3">
                                                                <div className="hidden sm:block shrink-0">
                                                                    {previews[n.link]?.image ? (
                                                                        <img
                                                                            src={previews[n.link]?.image}
                                                                            alt=""
                                                                            className="h-12 w-16 rounded-lg object-cover ring-1 ring-white/10"
                                                                            loading="lazy"
                                                                            referrerPolicy="no-referrer"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-12 w-16 rounded-lg bg-white/[0.03] ring-1 ring-white/10" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 group/link w-full">
                                                                        <h3 className="truncate text-sm font-semibold text-neutral-300 group-hover/link:text-sky-300 transition-colors">{n.title}</h3>
                                                                        <IconExternalLink className="mt-1 h-3 w-3 text-neutral-600 opacity-0 transition group-hover/link:opacity-100" />
                                                                    </a>
                                                                    <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                                                                        {previews[n.link]?.description || ""}
                                                                    </p>
                                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-neutral-600 font-mono uppercase">
                                                                        {previews[n.link]?.siteName && <span>{previews[n.link]?.siteName}</span>}
                                                                        {n.source && <span>{previews[n.link]?.siteName ? "•" : ""} {n.source}</span>}
                                                                        {n.category && n.category !== "other" && <span className="text-sky-700">• {n.category}</span>}
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
                                                                        className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-200 ring-1 ring-white/10 hover:ring-sky-500/30"
                                                                    >
                                                                        Preview
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-neutral-600 font-mono uppercase">
                                                                {n.source && <span>{n.source}</span>}
                                                                {n.category && n.category !== "other" && <span className="text-sky-700">• {n.category}</span>}
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
                                    <div className="rounded-2xl bg-white/[0.02] ring-1 ring-white/10 p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Market Pulse</h3>
                                            <span className="text-[10px] font-mono text-neutral-600">{allItemsCount} items</span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <div className="rounded-xl bg-black/40 p-3 ring-1 ring-white/5">
                                                <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">Top</div>
                                                <div className="mt-1 text-sm font-black text-white">{top5.length}</div>
                                            </div>
                                            <div className="rounded-xl bg-black/40 p-3 ring-1 ring-white/5">
                                                <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">Shown</div>
                                                <div className="mt-1 text-sm font-black text-white">{Math.min(count + 5, allItemsCount)}</div>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs text-neutral-500">
                                            Stories are ranked by recency + keyword relevance.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-white/[0.02] ring-1 ring-white/10 p-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Sources</h3>
                                        <div className="mt-3 space-y-2">
                                            {loading ? (
                                                <div className="h-20 animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10" />
                                            ) : (
                                                sources.map(([s, c]) => (
                                                    <div key={s} className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2 ring-1 ring-white/5">
                                                        <span className="text-xs font-semibold text-neutral-300 truncate">{s}</span>
                                                        <span className="text-[10px] font-mono text-neutral-600">{c}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-white/[0.02] ring-1 ring-white/10 p-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Trending</h3>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {loading ? (
                                                Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-white/5 ring-1 ring-white/10" />
                                                ))
                                            ) : trendingKeywords.length === 0 ? (
                                                <span className="text-xs text-neutral-600">No trend signals.</span>
                                            ) : (
                                                trendingKeywords.map((w) => (
                                                    <span key={w} className="rounded-full bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-300 ring-1 ring-sky-500/20">
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


/* --------------------------- NEWS FEED MODAL WRAPPER --------------------------- */
function NewsFeedModal({ activeMarket, showTip }: { activeMarket: string; showTip?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const prevBodyOverflowRef = useRef<string>("");

    const handleOpenModal = useCallback(() => {
        setIsOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                handleCloseModal();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, handleCloseModal]);

    useEffect(() => {
        if (!isOpen) return;
        prevBodyOverflowRef.current = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevBodyOverflowRef.current;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const raf = requestAnimationFrame(() => {
            closeButtonRef.current?.focus();
        });
        return () => {
            cancelAnimationFrame(raf);
            triggerRef.current?.focus();
        };
    }, [isOpen]);

    const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const root = modalRef.current;
        if (!root) return;

        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(",");

        const focusables = Array.from(root.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
            (el) => el.getAttribute("aria-hidden") !== "true"
        );

        if (focusables.length === 0) {
            e.preventDefault();
            closeButtonRef.current?.focus();
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
            if (!active || active === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (active === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }, []);

    return (
        <>
            <div className="w-full flex justify-center relative">
                <AnimatePresence>
                    {showTip && <HelperTip label="Latest News" className="-top-12" />}
                </AnimatePresence>

                <button
                    ref={triggerRef}
                    type="button"
                    onClick={handleOpenModal}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    className="relative w-full max-w-xl cursor-pointer group focus:outline-none focus:ring-2 focus:ring-sky-500/50 rounded-xl"
                >
                    {/* Shimmer border effect - purely decorative */}
                    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                        <motion.div
                            className="absolute inset-[-100%]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            style={{ background: shimmerGradient }}
                        />
                        <div className="absolute inset-[2px] bg-neutral-950 rounded-xl" />
                    </div>

                    {/* Button content */}
                    <div className="relative z-10 overflow-hidden rounded-xl bg-[#0a0a0a] p-1 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-sky-500/10 group-hover:-translate-y-1">
                        <div className="relative flex items-center justify-between rounded-[9px] bg-[#0a0a0a] px-4 py-3 md:px-6 md:py-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-900/10 text-sky-400 ring-1 ring-sky-500/20 animate-float-slow">
                                    <Newspaper className="h-5 w-5" />
                                </div>
                                <div className="text-left truncate">
                                    <h4 className="text-lg font-black text-white truncate animate-text-shimmer">Open News Feed</h4>
                                    <p className="text-xs text-neutral-500 truncate max-w-[200px] sm:max-w-none font-mono uppercase tracking-wide">
                                        {activeMarket !== "all" ? `LIVE ${activeMarket} HEADLINES` : "GLOBAL MARKET INTELLIGENCE"}
                                    </p>
                                </div>
                            </div>
                            <div className="text-neutral-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-sky-400">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </button>
            </div>

            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                key="news-modal-root"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 md:p-6"
                            >
                                {/* Backdrop */}
                                <motion.div
                                    key="news-modal-backdrop"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    onPointerDown={handleCloseModal}
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-black/95 backdrop-blur-md"
                                />

                                {/* Modal */}
                                <motion.div
                                    key="news-modal-dialog"
                                    ref={modalRef}
                                    role="dialog"
                                    aria-modal="true"
                                    tabIndex={-1}
                                    onKeyDown={handleModalKeyDown}
                                    initial={{ opacity: 0, scale: 0.96, y: 18 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: 18 }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.45 }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="relative z-10 w-full max-w-6xl h-[90vh] md:h-[85vh]"
                                >
                                    {/* Shimmer border - decorative */}
                                    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                        <motion.div
                                            className="absolute inset-[-100%]"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                            style={{ background: shimmerGradient }}
                                        />
                                        <div className="absolute inset-[2px] bg-black rounded-3xl" />
                                    </div>

                                    {/* Close button */}
                                    <button
                                        ref={closeButtonRef}
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                                        aria-label="Close news modal"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>

                                    {/* Modal content */}
                                    <div className="relative z-20 w-full h-full overflow-hidden rounded-3xl border border-sky-500/20 bg-black shadow-2xl">
                                        <NewsFeedContent activeMarket={activeMarket as MarketFilter} onClose={handleCloseModal} />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}

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
    <div id="market-dashboard" className="w-full overflow-x-hidden bg-black px-0 md:px-8 py-10">
      <style>{GLOBAL_STYLES}</style>
      <div className="mx-auto max-w-7xl px-4 md:px-0">
        <header className="text-center mb-12">
           
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-500 animate-text-shimmer drop-shadow-2xl">
                MARKET DASHBOARD
            </h1>
            <p className="mt-4 text-sm text-neutral-400 md:text-base max-w-2xl mx-auto">
                Real-time institutional grade data covering <span className="text-sky-400">Crypto</span>, <span className="text-sky-400">Stocks</span>, <span className="text-sky-400">Forex</span>, and <span className="text-sky-400">Metals</span>.
            </p>
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-900/10 text-sky-400 text-[10px] font-mono tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full bg-sky-500"></span>
                </span>
                System Online
            </div>
        </header>
        
        <div className="mt-10">
          {/* Tip Index 0: News */}
          <NewsFeedModal activeMarket={activeMarket} showTip={activeTipIndex === 0} />
        </div>

        <div className="mt-10">
          {/* Tip Index 1: Charts */}
          <TradingViewDropdown onMarketChange={setActiveMarket} showTip={activeTipIndex === 1} />
        </div>
      </div>
    </div>
  );
}
export default CTA;
