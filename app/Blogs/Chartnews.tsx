// components/cta.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, memo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { ChevronDown, ChartBar, Newspaper, X, ArrowRight } from "lucide-react";

// --- UTILS ---
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- HOOK: DEVICE CHECK (For Conditional Rendering) ---
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

// --- GLOBAL STYLES ---
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
  .animate-gradient-xy {
    animation: gradient-xy 15s ease infinite;
    background-size: 200% 200%;
  }
  .animate-float-slow {
    animation: float-particle 6s ease-in-out infinite;
  }
  .gpu-layer {
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
`;

// ==========================================
// NEW: SHIMMER BORDER COMPONENT (Thickened border)
// ==========================================

const shimmerGradient = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #3b82f6 50%, #00000000 100%)";

interface ShimmerBorderProps {
    children: ReactNode;
    className?: string;
    borderRadius?: string; // e.g. 'rounded-xl'
    borderWidth?: string; // e.g. 'inset-[3px]' <--- CHANGED DEFAULT
    speed?: number;
    colorOverride?: string;
    innerClassName?: string;
}

const ShimmerBorder = ({ children, className, borderRadius = 'rounded-xl', borderWidth = 'inset-[3px]', speed = 3, colorOverride, innerClassName }: ShimmerBorderProps) => {
    const finalGradient = colorOverride || shimmerGradient;
    
    return (
        <div className={cn("relative overflow-hidden group/shimmer", borderRadius, className)}>
            
            {/* Layer 1: The Spinning Gradient (The Border) */}
            <motion.div
                className="absolute inset-[-100%]" 
                animate={{ rotate: 360 }}
                transition={{ 
                    duration: speed, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                style={{ background: finalGradient }}
            />

            {/* Layer 2: Inner Mask (The actual content background) */}
            <div className={cn("absolute bg-neutral-900/90 flex items-center justify-center z-10", borderRadius, borderWidth, innerClassName)}>
                {/* Optional: Render children here if the outer div is just for sizing */}
            </div>
            
            {/* Ensure content is positioned over the mask */}
            <div className="relative z-20 h-full w-full">
                {children}
            </div>
        </div>
    );
};


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
    isChart = false 
}: { 
    title: string, 
    subtitle: string, 
    icon: React.ElementType, 
    onShow: () => void,
    isChart?: boolean
}) => {
    const isMobile = useIsMobile();
    
    const particles = useMemo(() => Array.from({ length: 12 }).map((_, i) => (
        <Particle key={i} delay={Math.random() * 2} />
    )), []);

    const bgClass = isMobile ? "bg-neutral-1000" : "animate-gradient-xy";
    const containerClass = isMobile ? "" : "gpu-layer";

    return (
        <motion.div
            className={cn(containerClass, "relative flex flex-col items-center justify-center overflow-hidden rounded-3xl py-12 md:py-16 cursor-pointer")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: isMobile ? 1.0 : 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onShow}
        >
            <div className={cn("absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111827] to-[#1e293b] opacity-90", bgClass)} />

            {!isMobile && (
                <>
                    <div className="absolute inset-0 opacity-30 blur-3xl bg-[radial-gradient(circle_at_50%_60%,rgba(56,189,248,0.3),transparent_60%)] animate-float-slow" />
                    <div className="absolute inset-0 pointer-events-none">{particles}</div>
                </>
            )}

            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50 mb-4 ${!isChart && !isMobile ? "animate-float-slow" : ""}`}>
                    <Icon className="h-8 w-8" />
                </div>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-400">
                        {title}
                    </span>
                </h2>
                
                <p className="mt-2 text-sm text-sky-300/80 max-w-sm px-4">
                    {subtitle}
                </p>

                {/* Apply ShimmerBorder to the Launch Terminal button - Increased border thickness */}
                <ShimmerBorder borderRadius="rounded-full" borderWidth="inset-[3px]" speed={3}>
                    <div className="relative z-10 flex items-center gap-2 rounded-full px-8 py-3 text-lg font-semibold text-white 
                                 shadow-[0_0_20px_rgba(56,189,248,0.2)] 
                                 bg-neutral-900/90 transition-all duration-300 group">
                        Launch Terminal 
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </ShimmerBorder>
            </div>
        </motion.div>
    );
});
HighAestheticCard.displayName = "HighAestheticCard";


/* --------------------------- DATA CONFIG (Static) --------------------------- */
const CHARTS = [
  { label: "Crypto Markets", category: "crypto", tabConfig: [{ title: "Crypto", symbols: [{ s: "BINANCE:BTCUSDT", d: "BTC / USDT" }, { s: "BINANCE:ETHUSDT", d: "ETH / USDT" }, { s: "BINANCE:SOLUSDT", d: "SOL / USDT" }, { s: "BINANCE:XRPUSDT", d: "XRP / USDT" }, { s: "BINANCE:DOGEUSDT", d: "DOGE / USDT" }] }] },
  { label: "Stock Markets", category: "stocks", tabConfig: [{ title: "US Stocks", symbols: [{ s: "NASDAQ:AAPL", d: "Apple" }, { s: "NASDAQ:MSFT", d: "Microsoft" }, { s: "NASDAQ:TSLA", d: "Tesla" }, { s: "NASDAQ:AMZN", d: "Amazon" }, { s: "NASDAQ:NVDA", d: "NVIDIA" }] }] },
  { label: "Forex Markets", category: "forex", tabConfig: [{ title: "Forex", symbols: [{ s: "FX:EURUSD", d: "EUR / USD" }, { s: "FX:GBPUSD", d: "GBP / USD" }, { s: "FX:USDJPY", d: "USD / JPY" }, { s: "FX:AUDUSD", d: "AUD / USD" }, { s: "FX:USDCHF", d: "USD / CHF" }] }] },
  { label: "Metals", category: "metals", tabConfig: [{ title: "Metals", symbols: [{ s: "TVC:GOLD", d: "Gold" }, { s: "TVC:SILVER", d: "Silver" }, { s: "TVC:PLATINUM", d: "Platinum" }, { s: "TVC:PALLADIUM", d: "Palladium" }] }] },
];

/* --------------------------- TRADINGVIEW WIDGET (Final Optimized) --------------------------- */
const TradingViewMarketOverview = memo(({ height = 560, tabs }: { height?: number; tabs: any }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    
    const currentScript = ref.current.querySelector("script");
    const newConfig = JSON.stringify(tabs);

    if (currentScript && currentScript.getAttribute('data-config') === newConfig) {
        return; 
    }

    ref.current.innerHTML = ""; 

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.setAttribute('data-config', newConfig); 
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: false,
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
    <div ref={ref} className="w-full bg-neutral-900 rounded-xl overflow-hidden" style={{ minHeight: height }}>
      <div className="tradingview-widget-container__widget" style={{ height }} />
    </div>
  );
});
TradingViewMarketOverview.displayName = "TradingViewMarketOverview";

/* --------------------------- CHART SECTION --------------------------- */
export const TradingViewDropdown = memo(({
  onMarketChange,
}: {
  onMarketChange?: (v: "all" | "crypto" | "stocks" | "forex" | "metals") => void;
}) => {
  const [selected, setSelected] = useState(CHARTS[0]);
  const [open, setOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 300 : 560;

  const handleSelect = useCallback((chart: any) => {
    setSelected(chart);
    setOpen(false);
    onMarketChange?.(chart.category);
  }, [onMarketChange]);

  return (
    <div className="relative mx-auto w-full max-w-screen-xl rounded-3xl border border-neutral-700/60 bg-neutral-900/40 p-4 md:p-6 shadow-2xl transition-all">
      {!showChart && (
        <HighAestheticCard
            title="Show Live Market Charts"
            subtitle="Experience live markets with a touch of the future."
            icon={ChartBar}
            onShow={() => setShowChart(true)}
            isChart={true}
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
            {/* Dropdown Button - Wrapped in ShimmerBorder - Increased border thickness */}
            <div className="mb-4 flex items-center justify-between">
                <ShimmerBorder borderRadius="rounded-full" borderWidth="inset-[3px]" speed={2}>
                    <button
                      onClick={() => setOpen((p) => !p)}
                      className="group relative flex items-center gap-3 rounded-full bg-neutral-900/90 px-5 py-2 text-sm font-semibold text-white shadow-lg transition"
                    >
                      <span className="relative z-10 text-sky-400">{selected.label}</span>
                      <ChevronDown className={`h-4 w-4 relative z-10 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                    </button>
                </ShimmerBorder>
            </div>

            {/* Dropdown Menu - No shimmer for performance, just styled */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-20 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900/95 shadow-lg"
                >
                  {CHARTS.map((chart, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(chart)}
                      className={cn(
                        "block w-full px-4 py-2 text-left text-sm text-white transition-all duration-200 hover:bg-sky-600/20",
                        selected.label === chart.label && "bg-sky-600/60 font-bold"
                      )}
                    >
                      {chart.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Chart */}
            <div className="relative mt-4 w-full rounded-2xl border border-neutral-700 bg-neutral-950/40 p-1 md:p-2" style={{ minHeight: chartHeight }}>
              <TradingViewMarketOverview height={chartHeight} tabs={selected.tabConfig} />
            </div>

            {/* Hide Chart Button - Wrapped in ShimmerBorder - Increased border thickness */}
            <div className="mt-6 flex justify-center">
                <ShimmerBorder borderRadius="rounded-full" borderWidth="inset-[3px]" speed={3}>
                    <button
                      onClick={() => {
                        setOpen(false);
                        setShowChart(false);
                      }}
                      className="relative rounded-full border border-transparent bg-neutral-900 px-8 py-2 text-sm text-neutral-300 transition-all hover:bg-neutral-800 hover:text-white hover:scale-105 active:scale-95"
                    >
                      Hide Chart
                    </button>
                </ShimmerBorder>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
TradingViewDropdown.displayName = "TradingViewDropdown";

/* --------------------------- NEWS FEED LOGIC (Pure Functions) --------------------------- */
type MarketFilter = "all" | "crypto" | "stocks" | "forex" | "metals";
type NewsItem = { title: string; link: string; source?: string; published_at?: string; category?: MarketFilter | "other"; };

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

/* --------------------------- NEWS FEED CONTENT (Optimized) --------------------------- */
const NewsFeedContent = memo(({ activeMarket, onClose }: { activeMarket: MarketFilter, onClose: () => void }) => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [count, setCount] = useState<number>(10);
    const [refreshKey, setRefreshKey] = useState(0);

    const NEWS_REFRESH_RATE = 20000; // 20 seconds

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch("/api/crypto-news", { cache: "no-store" });
            const json = await r.json();
            const rawItems: NewsItem[] = Array.isArray(json?.items) ? json.items : [];
            const tagged = rawItems.map((n) => ({ ...n, category: detectCategory(n.title || "") }));
            setItems(tagged);
            setLastUpdated(new Date());
        } catch {
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

    return (
        <div className="flex h-[90vh] max-h-[90vh] flex-col md:h-[700px] md:max-h-[700px] overflow-hidden">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-4 md:px-6 py-4">
                <div className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-sky-400" />
                    <span className="font-semibold text-white truncate max-w-[150px] md:max-w-none">{marketTitle}</span>
                    <span className="ml-2 md:ml-4 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400 hidden sm:block">Live</span>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && <span className="text-xs text-neutral-500 hidden sm:block">Updated {lastUpdated.toLocaleTimeString()}</span>}
                    {/* Refresh Button - Wrapped in ShimmerBorder - Increased border thickness */}
                    <ShimmerBorder borderRadius="rounded-full" borderWidth="inset-[3px]" speed={1.5}>
                        <button onClick={() => setRefreshKey(p => p + 1)} className="group relative rounded-full p-2 transition-colors bg-neutral-900 hover:bg-white/10">
                            <IconRefresh className={cn("h-4 w-4 text-neutral-400 group-hover:text-white", loading && "animate-spin")} />
                        </button>
                    </ShimmerBorder>
                    {/* Close Button - Wrapped in ShimmerBorder - Increased border thickness */}
                    <ShimmerBorder borderRadius="rounded-full" borderWidth="inset-[3px]" speed={1.5} colorOverride="conic-gradient(from 90deg at 50% 50%, #00000000 0%, #ef4444 50%, #00000000 100%)">
                        <button onClick={onClose} className="relative rounded-full bg-neutral-900 p-2 text-neutral-400 transition hover:bg-red-500/20 hover:text-red-400">
                            <X className="h-5 w-5" />
                        </button>
                    </ShimmerBorder>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-950/90">
                
                {/* Top Headlines Grid */}
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-white/90">MAJOR HEADLINES</h3>
                        <div className="h-px w-1/2 bg-gradient-to-r from-sky-500/50 via-blue-500/30 to-transparent ml-4 hidden md:block" />
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-5">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-white/5 ring-1 ring-white/10" />)
                            : top5.map((item, i) => (
                                <a
                                    key={`${item.link}-${i}`}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative rounded-lg bg-neutral-900/60 p-3 ring-1 ring-white/10 transition hover:ring-sky-500/40 hover:-translate-y-1 duration-200"
                                >
                                    <div className="text-[10px] uppercase tracking-wide text-sky-300/80">{(item.category || "Market").toUpperCase()}</div>
                                    <div className="mt-1 line-clamp-3 text-sm font-semibold text-white/90">{item.title}</div>
                                    <div className="mt-1 text-xs text-neutral-400">{timeAgo(item.published_at)}</div>
                                </a>
                            ))}
                    </div>
                </div>

                {/* Remaining Headlines List */}
                <div className="border-t border-white/10">
                    <div className="sticky top-0 z-10 bg-neutral-950/95 px-4 py-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-white/90">
                                All Headlines ({allItemsCount} Available)
                            </h3>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-neutral-500">Show</label>
                                <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-md bg-white/5 px-2 py-1 text-sm text-neutral-200 ring-1 ring-white/10 outline-none">
                                    {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <ul className="divide-y divide-white/10">
                        {loading && Array.from({ length: 8 }).map((_, i) => (
                            <li key={i} className="animate-pulse p-4">
                                <div className="h-3 w-1/3 rounded bg-white/10" />
                                <div className="mt-2 h-4 w-2/3 rounded bg-white/10" />
                            </li>
                        ))}
                        {!loading && rest.map((n, i) => (
                            <li key={`${n.link}-${i}`} className="group px-4 py-3 transition hover:bg-white/[0.035]">
                                <div className="flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,.6)]" />
                                    <div className="min-w-0 flex-1">
                                        <a href={n.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                                            <h3 className="truncate text-[15px] font-semibold text-white md:text-base">{n.title}</h3>
                                            <IconExternalLink className="h-4 w-4 text-neutral-400 opacity-0 transition group-hover:opacity-100" />
                                        </a>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                                            {n.category && n.category !== 'other' && <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">{n.category}</span>}
                                            {n.published_at && <time dateTime={n.published_at}>{timeAgo(n.published_at)}</time>}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {!loading && allItemsCount === 0 && (
                            <li className="px-4 py-10 text-center text-sm text-neutral-400">No free headlines available right now. Try another market or refresh.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
});
NewsFeedContent.displayName = "NewsFeedContent";


/* --------------------------- NEWS FEED MODAL WRAPPER --------------------------- */
function NewsFeedModal({ activeMarket }: { activeMarket: string }) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    return (
        <>
            <div className="w-full flex justify-center">
                {/* Modal Trigger Button - Wrapped in ShimmerBorder - Increased border thickness */}
                <ShimmerBorder borderRadius="rounded-xl" borderWidth="inset-[3px]" speed={4} className="w-full max-w-xl">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="group relative w-full max-w-xl overflow-hidden rounded-xl bg-neutral-900 p-1 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/20 hover:-translate-y-1 hover:scale-[1.005]"
                    >
                        
                        <div className="relative flex items-center justify-between rounded-[7px] bg-neutral-950 px-4 py-3 md:px-6 md:py-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30 animate-float-slow">
                                    <Newspaper className="h-5 w-5" />
                                </div>
                                <div className="text-left truncate">
                                    <h4 className="text-lg font-bold text-white truncate">Open Live News Feed</h4>
                                    <p className="text-sm text-neutral-400 truncate max-w-[200px] sm:max-w-none">
                                        {activeMarket !== 'all' 
                                            ? `View ${activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1)} Headlines`
                                            : "Global real-time market updates and analysis"
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="text-sky-400 transition-transform duration-300 group-hover:translate-x-1">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                        </div>
                    </button>
                </ShimmerBorder>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[101] flex items-end md:items-center justify-center p-0 md:p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/80"
                        />
                        {/* Modal Body - Wrapped in ShimmerBorder - Increased border thickness */}
                        <ShimmerBorder borderRadius="rounded-t-3xl md:rounded-3xl" borderWidth="inset-[3px]" speed={5} className="w-full max-w-4xl h-full md:h-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 1, y: 100 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1, y: 100 }}
                                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                                className="relative w-full max-w-4xl overflow-hidden rounded-t-3xl md:rounded-3xl border border-transparent bg-neutral-950 shadow-2xl"
                            >
                                <NewsFeedContent activeMarket={activeMarket as MarketFilter} onClose={() => setIsOpen(false)} />
                            </motion.div>
                        </ShimmerBorder>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

/* --------------------------- MAIN EXPORT --------------------------- */

export function CTA() {
  const [activeMarket, setActiveMarket] = useState<"all" | "crypto" | "stocks" | "forex" | "metals">("all");

  return (
    <div id="market-dashboard" className="w-full overflow-x-hidden bg-black px-0 md:px-8 py-10 dark:bg-neutral-950">
      <style>{GLOBAL_STYLES}</style>
      <div className="mx-auto max-w-7xl px-4 md:px-0">
        <header className="text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-sky-400/80">Live • Market Updates</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white md:text-4xl">
                Real-Time Global Market Dashboard
            </h1>
            <p className="mt-2 text-xs text-neutral-400 md:text-sm">
                Covering Crypto, Stocks, Forex, and Metals — updated every minute.
            </p>
        </header>
        
        <div className="mt-10">
          <NewsFeedModal activeMarket={activeMarket} />
        </div>

        <div className="mt-10">
          <TradingViewDropdown onMarketChange={setActiveMarket} />
        </div>
      </div>
    </div>
  );
}
export default CTA;