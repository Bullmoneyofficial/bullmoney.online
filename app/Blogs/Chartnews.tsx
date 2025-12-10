// components/cta.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { ChevronDown, ChartBar, Newspaper, X, Maximize2, ArrowRight } from "lucide-react";

// Assuming cn is correctly imported or defined locally
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/* --------------------------- HIGH AESTHETIC CARD COMPONENT (MODIFIED FOR RECTANGLE) --------------------------- */

// This component is the universal, highly aesthetic trigger for both the Chart and News Modals.
function HighAestheticCard({ 
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
}) {
    return (
        <motion.div
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl py-12 md:py-16 cursor-pointer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onShow}
        >
            {/* Animated gradient background (Shimmer Effect) */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-[#0b1729] via-[#111827] to-[#1e293b] opacity-90"
                animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

            {/* Soft motion glow */}
            <motion.div
                className="absolute inset-0 opacity-30 blur-3xl"
                style={{
                    background: "radial-gradient(circle at 50% 60%, rgba(56,189,248,.3), transparent 60%)",
                }}
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Floating sparkles */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.span
                        key={i}
                        className="absolute h-[2px] w-[2px] rounded-full bg-sky-400/60"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -10, 0],
                            opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                
                {/* Icon */}
                <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50 mb-4"
                    animate={isChart ? {} : { rotate: [0, -5, 5, 0] }} // Subtle animation for News
                    transition={isChart ? {} : { duration: 0.8, repeat: Infinity, delay: 3 }}
                >
                    <Icon className="h-8 w-8" />
                </motion.div>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-400">
                        {title}
                    </span>
                </h2>
                
                <p className="mt-2 text-sm text-sky-300/80 max-w-sm">
                    {subtitle}
                </p>

                {/* Main Action Button */}
                <motion.button
                    className="relative z-10 mt-6 flex items-center gap-2 rounded-full px-8 py-3 text-lg font-semibold text-white 
                             shadow-[0_0_35px_rgba(56,189,248,0.4)] 
                             bg-[linear-gradient(100deg,#0284c7_0%,#2563eb_50%,#312e81_100%)]
                             ring-2 ring-sky-400/40 transition-all duration-300"
                >
                    Launch Terminal 
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
            </div>
        </motion.div>
    );
}


/* --------------------------- CHART CONFIGS (KEPT AS IS) --------------------------- */

const charts = [
  {
    label: "Crypto Markets",
    category: "crypto",
    tabConfig: [
      {
        title: "Crypto",
        symbols: [
          { s: "BINANCE:BTCUSDT", d: "BTC / USDT" },
          { s: "BINANCE:ETHUSDT", d: "ETH / USDT" },
          { s: "BINANCE:SOLUSDT", d: "SOL / USDT" },
          { s: "BINANCE:XRPUSDT", d: "XRP / USDT" },
          { s: "BINANCE:DOGEUSDT", d: "DOGE / USDT" },
        ],
      },
    ],
  },
  {
    label: "Stock Markets",
    category: "stocks",
    tabConfig: [
      {
        title: "US Stocks",
        symbols: [
          { s: "NASDAQ:AAPL", d: "Apple" },
          { s: "NASDAQ:MSFT", d: "Microsoft" },
          { s: "NASDAQ:TSLA", d: "Tesla" },
          { s: "NASDAQ:AMZN", d: "Amazon" },
          { s: "NASDAQ:NVDA", d: "NVIDIA" },
        ],
      },
    ],
  },
  {
    label: "Forex Markets",
    category: "forex",
    tabConfig: [
      {
        title: "Forex",
        symbols: [
          { s: "FX:EURUSD", d: "EUR / USD" },
          { s: "FX:GBPUSD", d: "GBP / USD" },
          { s: "FX:USDJPY", d: "USD / JPY" },
          { s: "FX:AUDUSD", d: "AUD / USD" },
          { s: "FX:USDCHF", d: "USD / CHF" },
        ],
      },
    ],
  },
  {
    label: "Metals",
    category: "metals",
    tabConfig: [
      {
        title: "Metals",
        symbols: [
          { s: "TVC:GOLD", d: "Gold" },
          { s: "TVC:SILVER", d: "Silver" },
          { s: "TVC:PLATINUM", d: "Platinum" },
          { s: "TVC:PALLADIUM", d: "Palladium" },
        ],
      },
    ],
  },
];

/* --------------------------- TRADINGVIEW WIDGET (KEPT AS IS) --------------------------- */
const TradingViewMarketOverview: React.FC<{ height?: number; tabs: any }> = ({
  height = 560,
  tabs,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadWidget = () => {
      if (!ref.current) return;
      ref.current.innerHTML = "";
      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
      script.async = true;
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
    };
    loadWidget();
    const interval = setInterval(loadWidget, 60000);
    return () => clearInterval(interval);
  }, [height, tabs]);

  return (
    <div ref={ref} className="w-full" style={{ minHeight: height }}>
      <div className="tradingview-widget-container__widget" style={{ height }} />
    </div>
  );
};

/* ---------------------- MINIMAL FUTURE-RUSTIC HERO (KEPT AS IS) ---------------------- */
// The functionality of FuturisticHero is now moved to HighAestheticCard.
function FuturisticHero({ onShow }: { onShow: () => void }) {
  return (
    <HighAestheticCard
      title="Show Live Market Charts"
      subtitle="Experience live markets with a touch of the future."
      icon={ChartBar}
      onShow={onShow}
      isChart={true}
    />
  );
}

/* --------------------------- CHART SECTION (KEPT AS IS) --------------------------- */
export const TradingViewDropdown = ({
  onMarketChange,
}: {
  onMarketChange?: (v: "all" | "crypto" | "stocks" | "forex" | "metals") => void;
}) => {
  const [selected, setSelected] = React.useState(charts[0]);
  const [open, setOpen] = React.useState(false);
  const [showChart, setShowChart] = React.useState(false);

  const handleSelect = (chart: any) => {
    setSelected(chart);
    setOpen(false);
    onMarketChange?.(chart.category);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mx-auto w-full max-w-screen-xl rounded-3xl border border-neutral-700/60 bg-neutral-900/40 p-6 backdrop-blur-lg shadow-2xl"
    >
      {!showChart && <FuturisticHero onShow={() => setShowChart(true)} />}

      <AnimatePresence mode="wait">
        {showChart && (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
          >
            {/* Dropdown */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setOpen((p) => !p)}
                className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition"
              >
                <span className="absolute inset-0 rounded-full border border-sky-400 opacity-0 blur-sm transition group-hover:opacity-100"></span>
                <ChartBar className="relative z-10 h-4 w-4 transition-transform group-hover:rotate-12" />
                <span className="relative z-10">{selected.label}</span>
                <motion.div
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="absolute z-20 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800/90 backdrop-blur-md shadow-lg"
                >
                  {charts.map((chart, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(chart)}
                      className={cn(
                        "block w-full px-4 py-2 text-left text-sm text-white transition-all duration-200 hover:bg-gradient-to-r hover:from-sky-600 hover:to-blue-700",
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
            <div className="relative mt-4 w-full rounded-2xl border border-neutral-700 bg-neutral-950/40 p-2">
              <TradingViewMarketOverview height={560} tabs={selected.tabConfig} />
            </div>

            {/* Hide Chart */}
            <div className="mt-6 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setOpen(false);
                  setShowChart(false);
                }}
                className="rounded-full border border-neutral-700 bg-neutral-800 px-8 py-2 text-sm text-neutral-300 transition-all hover:bg-neutral-700 hover:text-white"
              >
                Hide Chart
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* --------------------------- HEADER (KEPT AS IS) --------------------------- */
function Header() {
  return (
    <header className="text-center">
      <p className="text-[11px] uppercase tracking-[0.18em] text-sky-400/80">
        Live • Market Updates
      </p>
      <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 dark:text-white md:text-4xl">
        Real-Time Global Market Dashboard
      </h1>
      <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 md:text-sm">
        Covering Crypto, Stocks, Forex, and Metals — updated every minute.
      </p>
    </header>
  );
}

/* ----------------------------- NEWS FEED SECTION (MODAL REPLACEMENT) ----------------------------- */

type MarketFilter = "all" | "crypto" | "stocks" | "forex" | "metals";
type NewsItem = {
  title: string;
  link: string;
  source?: string;
  published_at?: string;
  category?: MarketFilter | "other";
};

const MARKET_KEYWORDS = {
  crypto: ["bitcoin", "btc", "ethereum", "eth", "solana", "binance", "crypto", "doge", "xrp", "defi", "blockchain"],
  stocks: ["nasdaq", "dow", "s&p", "tesla", "apple", "microsoft", "amazon", "nvidia", "stock", "earnings", "ipo"],
  forex: ["eurusd", "gbpusd", "usdjpy", "audusd", "usdchf", "forex", "currency", "exchange rate", "federal reserve"],
  metals: ["gold", "silver", "platinum", "palladium", "metal", "commodity", "precious", "oil"],
} as const;

const ALL_KEYWORDS = Object.values(MARKET_KEYWORDS).flat();

function timeAgo(iso?: string) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function detectCategory(title: string): MarketFilter | "other" {
  const lower = title.toLowerCase();
  for (const [category, words] of Object.entries(MARKET_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return category as MarketFilter;
  }
  return "other";
}

function score(item: NewsItem) {
  const now = Date.now();
  const t = item.published_at ? Date.parse(item.published_at) : now - 1000 * 60 * 60 * 48;
  const hours = Math.max(1, (now - t) / (1000 * 60 * 60));
  const recency = Math.max(0, 1 - Math.log2(hours + 1) / 8);
  const title = (item.title || "").toLowerCase();
  let kw = 0;
  for (const k of ALL_KEYWORDS) if (title.includes(k)) kw += 1;
  const sourceBoost = /coindesk|cointelegraph|reuters|investing|bloomberg/i.test(item.source || "")
    ? 0.05
    : 0;
  return recency * 0.6 + Math.min(1, kw / 3) * 0.35 + sourceBoost;
}

// --- Internal Modal Content Component (KEPT AS IS) ---
function NewsFeedContent({ activeMarket, onClose }: { activeMarket: MarketFilter, onClose: () => void }) {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [count, setCount] = useState<number>(10);
    const [refreshKey, setRefreshKey] = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            // Replace with your actual news API call
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

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    useEffect(() => {
        const id = setInterval(load, 60000);
        return () => clearInterval(id);
    }, [load]);

    const filtered = useMemo(
        () => (activeMarket === "all" ? items : items.filter((i) => i.category === activeMarket)),
        [items, activeMarket]
    );

    const ranked = useMemo(() => [...filtered].sort((a, b) => score(b) - score(a)), [filtered]);
    const top5 = ranked.slice(0, 5); 
    const rest = ranked.slice(5, 5 + count);

    const marketTitle = activeMarket === "all" ? "Global Feed" : activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1) + " News";

    return (
        <div className="flex h-[80vh] flex-col md:h-[700px] overflow-hidden">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-sky-400" />
                    <span className="font-semibold text-white">{marketTitle}</span>
                    <span className="ml-4 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                      Live
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-xs text-neutral-500 hidden sm:block">
                            Updated {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <button 
                        onClick={() => setRefreshKey(p => p + 1)}
                        className="group rounded-full p-2 transition-colors hover:bg-white/10"
                    >
                        <IconRefresh className={cn("h-4 w-4 text-neutral-400 group-hover:text-white", loading && "animate-spin")} />
                    </button>
                    <button 
                        onClick={onClose}
                        className="rounded-full bg-white/5 p-2 text-neutral-400 transition hover:bg-red-500/20 hover:text-red-400"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-950/90">
                
                {/* Top Headlines Grid */}
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-white/90">MAJOR HEADLINES</h3>
                        <div className="h-px w-1/2 bg-gradient-to-r from-sky-500/50 via-blue-500/30 to-transparent" />
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-5">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-24 animate-pulse rounded-lg bg-white/5 ring-1 ring-white/10" />
                            ))
                            : top5.map((item, i) => (
                                <motion.a
                                    key={`${item.link}-${i}`}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative rounded-lg bg-neutral-900/60 p-3 ring-1 ring-white/10 transition hover:ring-sky-500/40"
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="text-[11px] uppercase tracking-wide text-sky-300/80">
                                        {(item.category || "Market").toUpperCase()}
                                    </div>
                                    <div className="mt-1 line-clamp-3 text-sm font-semibold text-white/90">{item.title}</div>
                                    <div className="mt-1 text-xs text-neutral-400">{timeAgo(item.published_at)}</div>
                                    <span className="pointer-events-none absolute -inset-px rounded-lg bg-gradient-to-r from-sky-500/0 via-blue-600/0 to-indigo-500/0 opacity-0 transition group-hover:opacity-30" />
                                </motion.a>
                            ))}
                    </div>
                </div>

                {/* Remaining Headlines List */}
                <div className="border-t border-white/10">
                    <div className="sticky top-0 z-10 bg-neutral-950/80 px-4 py-2 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-white/90">
                                All Headlines ({rest.length} Items)
                            </h3>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-neutral-500 dark:text-neutral-400">Show</label>
                                <select
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className="rounded-md bg-white/5 px-2 py-1 text-sm text-neutral-200 ring-1 ring-white/10 outline-none hover:ring-sky-500/30"
                                >
                                    {[5, 10, 20, 50].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <ul className="divide-y divide-white/10">
                        <AnimatePresence initial={false}>
                            {loading &&
                                Array.from({ length: 8 }).map((_, i) => (
                                    <li key={i} className="animate-pulse p-4">
                                        <div className="h-3 w-1/3 rounded bg-white/10" />
                                        <div className="mt-2 h-4 w-2/3 rounded bg-white/10" />
                                    </li>
                                ))}

                            {!loading &&
                                rest.map((n, i) => (
                                    <motion.li
                                        key={`${n.link}-${i}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18 }}
                                        className="group px-4 py-3 transition hover:bg-white/[0.035]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,.6)]" />
                                            <div className="min-w-0 flex-1">
                                                <a
                                                    href={n.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2"
                                                >
                                                    <h3 className="truncate text-[15px] font-semibold text-white md:text-base">{n.title}</h3>
                                                    <IconExternalLink className="h-4 w-4 text-neutral-400 opacity-0 transition group-hover:opacity-100" />
                                                </a>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                                                    {n.category && n.category !== 'other' && (
                                                        <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">{n.category}</span>
                                                    )}
                                                    {n.published_at && (
                                                        <time dateTime={n.published_at}>{timeAgo(n.published_at)}</time>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}

                            {!loading && ranked.length === 0 && (
                                <motion.li
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="px-4 py-10 text-center text-sm text-neutral-400"
                                >
                                    No free headlines available right now. Try another market or refresh.
                                </motion.li>
                            )}
                        </AnimatePresence>
                    </ul>
                </div>
            </div>
        </div>
    );
}

// --- Wrapper Component that replaces the old NewsFeed inline rendering ---
function NewsFeedModal({ activeMarket }: { activeMarket: string }) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    return (
        <>
            {/* The NEW, RECTANGULAR, HIGH-AESTHETIC TRIGGER BUTTON */}
            <div className="w-full flex justify-center">
                <motion.button
                    onClick={() => setIsOpen(true)}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    // Max-width limited to prevent it from dominating the page too much, 
                    // but wide enough for a clear rectangular shape.
                    className="group relative w-full max-w-xl overflow-hidden rounded-xl bg-neutral-900 p-1 transition-shadow duration-300 hover:shadow-2xl hover:shadow-sky-500/20"
                >
                    {/* Animated Outer Ring/Glow (Simulates the Chart's shimmer effect) */}
                    <motion.div 
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                        animate={{
                            opacity: [0.2, 0.4, 0.2],
                            scale: [1, 1.02, 1],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Card Content (Structured horizontally for rectangular look) */}
                    <div className="relative flex items-center justify-between rounded-[7px] bg-[#0a0a0a] px-6 py-4">
                        
                        <div className="flex items-center gap-4">
                            {/* Animated Icon */}
                            <motion.div
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30"
                                animate={{ rotate: [0, -5, 5, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 3 }}
                            >
                                <Newspaper className="h-5 w-5" />
                            </motion.div>
                            
                            <div className="text-left">
                                <h4 className="text-lg font-bold text-white">Open Live News Feed</h4>
                                <p className="text-sm text-neutral-400">
                                    {activeMarket !== 'all' 
                                        ? `View ${activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1)} Headlines`
                                        : "Global real-time market updates and analysis"
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Action Arrow */}
                        <motion.div
                            className="text-sky-400 transition-transform duration-300 group-hover:translate-x-1"
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                        >
                            <ArrowRight className="h-5 w-5" />
                        </motion.div>
                    </div>
                </motion.button>
            </div>

            {/* Modal Overlay (The modal content is untouched) */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
                        >
                            <NewsFeedContent activeMarket={activeMarket as MarketFilter} onClose={() => setIsOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

/* --------------------------- PAGE WRAPPER (CTA) --------------------------- */

export function CTA() {
  const [activeMarket, setActiveMarket] = React.useState<
    "all" | "crypto" | "stocks" | "forex" | "metals"
  >("all");

  return (
    <div id="market-dashboard" className="w-full bg-white px-4 py-10 dark:bg-neutral-950 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Header />
        
        {/* NEWS FEED SECTION: MOVED ABOVE CHART, RECTANGULAR BUTTON */}
        <div className="mt-10">
          <NewsFeedModal activeMarket={activeMarket} />
        </div>

        {/* CHART SECTION: KEPT ORIGINAL LOGIC/AESTHETIC */}
        <div className="mt-10">
          <TradingViewDropdown onMarketChange={setActiveMarket} />
        </div>
      </div>
    </div>
  );
}
export default CTA;