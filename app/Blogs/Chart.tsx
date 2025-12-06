// components/cta.tsx
"use client";

import React from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion"; // Added hooks
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { ChevronDown, ChartBar } from "lucide-react";
import { cn } from "@/lib/utils";

/* --------------------------- CHART CONFIGS --------------------------- */

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

/* --------------------------- TRADINGVIEW WIDGET --------------------------- */
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




/* ---------------------- MINIMAL FUTURE-RUSTIC HERO ---------------------- */
function FuturisticHero({ onShow }: { onShow: () => void }) {
  const heroRef = React.useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <motion.div
      ref={heroRef}
      className="relative flex cursor-none flex-col items-center justify-center overflow-hidden rounded-3xl py-28 md:py-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
     

      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#0b1729] via-[#111827] to-[#1e293b]"
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
          background:
            "radial-gradient(circle at 50% 60%, rgba(56,189,248,.2), transparent 60%)",
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.45, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
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

      {/* Button with glowing border */}
      <motion.button
        onClick={onShow}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="relative z-10 flex cursor-pointer items-center gap-2 rounded-full px-12 py-4 text-lg font-semibold text-white 
             shadow-[0_0_35px_rgba(56,189,248,0.4)] 
             bg-[linear-gradient(100deg,#0284c7_0%,#2563eb_50%,#312e81_100%)]
             ring-2 ring-sky-400/40 hover:ring-sky-300/70 transition-all duration-300"
      >
        Show Live Market Charts
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-sky-500/40 opacity-0 blur-md"
          whileHover={{ opacity: 0.4, scale: 1.1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </motion.button>

      {/* Subtitle */}
      <motion.p
        className="relative z-10 mt-5 text-sm text-sky-300/80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Experience live markets with a touch of the future.
      </motion.p>
    </motion.div>
  );
}

/* --------------------------- CHART SECTION --------------------------- */
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

/* --------------------------- PAGE WRAPPER --------------------------- */

export function CTA() {
  const [activeMarket, setActiveMarket] = React.useState<
    "all" | "crypto" | "stocks" | "forex" | "metals"
  >("all");

  return (
    <div id="market-dashboard" className="w-full bg-white px-4 py-10 dark:bg-neutral-950 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Header />
        <div className="mt-10">
          <TradingViewDropdown onMarketChange={setActiveMarket} />
        </div>
        </div>
      </div>
  );
}
export default CTA;

/* --------------------------- HEADER --------------------------- */
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