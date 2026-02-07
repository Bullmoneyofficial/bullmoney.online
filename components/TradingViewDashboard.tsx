'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, ExternalLink, ChevronDown, Globe, Monitor, Smartphone, Apple } from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TradingView Dashboard — Exact TradingView replica
// Real chart, real watchlist, real prices — all via TradingView widgets
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MARKET_OVERVIEW_TABS = [
  {
    title: 'Indices',
    symbols: [
      { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
      { s: 'FOREXCOM:NSXUSD', d: 'NASDAQ 100' },
      { s: 'FOREXCOM:DJI', d: 'Dow Jones' },
      { s: 'TVC:VIX', d: 'VIX' },
      { s: 'TVC:DXY', d: 'DXY' },
    ],
  },
  {
    title: 'Stocks',
    symbols: [
      { s: 'NASDAQ:AAPL', d: 'Apple' },
      { s: 'NASDAQ:TSLA', d: 'Tesla' },
      { s: 'NASDAQ:NFLX', d: 'Netflix' },
      { s: 'NASDAQ:NVDA', d: 'NVIDIA' },
      { s: 'NASDAQ:MSFT', d: 'Microsoft' },
      { s: 'NASDAQ:AMZN', d: 'Amazon' },
      { s: 'NASDAQ:META', d: 'Meta' },
      { s: 'NASDAQ:GOOGL', d: 'Alphabet' },
    ],
  },
  {
    title: 'Futures',
    symbols: [
      { s: 'TVC:USOIL', d: 'Crude Oil WTI' },
      { s: 'OANDA:XAUUSD', d: 'Gold' },
      { s: 'OANDA:XAGUSD', d: 'Silver' },
    ],
  },
  {
    title: 'Crypto',
    symbols: [
      { s: 'BINANCE:BTCUSDT', d: 'Bitcoin' },
      { s: 'BINANCE:ETHUSDT', d: 'Ethereum' },
      { s: 'BINANCE:SOLUSDT', d: 'Solana' },
    ],
  },
];

const TICKER_SYMBOLS = [
  { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
  { proName: 'FOREXCOM:NSXUSD', title: 'NASDAQ' },
  { proName: 'FOREXCOM:DJI', title: 'Dow Jones' },
  { proName: 'NASDAQ:AAPL', title: 'Apple' },
  { proName: 'NASDAQ:TSLA', title: 'Tesla' },
  { proName: 'NASDAQ:NVDA', title: 'NVIDIA' },
  { proName: 'NASDAQ:MSFT', title: 'Microsoft' },
  { proName: 'TVC:USOIL', title: 'Oil' },
  { proName: 'OANDA:XAUUSD', title: 'Gold' },
  { proName: 'BINANCE:BTCUSDT', title: 'Bitcoin' },
  { proName: 'BINANCE:ETHUSDT', title: 'Ethereum' },
];

// ─── TradingView Logo ────────────────────────────────────────
const TVLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 36 28" fill="currentColor" className="text-blue-500">
    <path d="M14 22H7V6h7v16zM21 22h-5V0h5v22zM28 22h-5V11h5v11z" />
  </svg>
);

// ─── TradingView Download Links Toggle ───────────────────────
const TV_LINKS = [
  { label: 'iPhone / iPad', href: 'https://apps.apple.com/app/tradingview-track-all-markets/id1205990992', icon: 'apple' as const },
  { label: 'Android', href: 'https://play.google.com/store/apps/details?id=com.tradingview.tradingviewapp', icon: 'phone' as const },
  { label: 'Windows', href: 'https://www.tradingview.com/desktop/', icon: 'desktop' as const },
  { label: 'macOS', href: 'https://www.tradingview.com/desktop/', icon: 'desktop' as const },
  { label: 'Web Platform', href: 'https://www.tradingview.com/chart/', icon: 'web' as const },
];

const TVDownloadToggle = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
          isOpen ? 'bg-blue-500/20 text-blue-400' : 'bg-[#111] text-[#666] hover:text-[#999] hover:bg-[#1a1a1a]'
        }`}
      >
        <ExternalLink size={12} />
        <span className="hidden sm:inline">Download</span>
        <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1.5 right-0 z-[9999] w-56 bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
          <div className="px-3 py-2 border-b border-[#1a1a1a]">
            <span className="text-[10px] text-[#555] font-medium uppercase tracking-wider">Download TradingView</span>
          </div>
          {TV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#151515] transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                {link.icon === 'apple' && <Apple size={14} className="text-[#888] group-hover:text-blue-400" />}
                {link.icon === 'phone' && <Smartphone size={14} className="text-[#888] group-hover:text-blue-400" />}
                {link.icon === 'desktop' && <Monitor size={14} className="text-[#888] group-hover:text-blue-400" />}
                {link.icon === 'web' && <Globe size={14} className="text-[#888] group-hover:text-blue-400" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-[#ccc] group-hover:text-white font-medium">{link.label}</span>
              </div>
              <ExternalLink size={10} className="ml-auto text-[#444] group-hover:text-blue-400" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

function loadTradingViewWidget(
  container: HTMLDivElement,
  widgetUrl: string,
  config: Record<string, unknown>
) {
  container.innerHTML = '';
  // Force black background on the container itself
  container.style.backgroundColor = '#000000';
  const script = document.createElement('script');
  script.src = widgetUrl;
  script.async = true;
  script.innerHTML = JSON.stringify(config);
  container.appendChild(script);

  // Force black bg on any iframes TradingView injects
  const observer = new MutationObserver(() => {
    container.querySelectorAll('iframe').forEach((iframe) => {
      iframe.style.backgroundColor = '#000000';
    });
  });
  observer.observe(container, { childList: true, subtree: true });
  // Clean up after 10s (widgets are loaded by then)
  setTimeout(() => observer.disconnect(), 10000);
}

export default function TradingViewDashboard() {
  const chartRef = useRef<HTMLDivElement>(null);
  const watchlistRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const mobileChartRef = useRef<HTMLDivElement>(null);
  const mobileWatchlistRef = useRef<HTMLDivElement>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSymbol] = useState('NASDAQ:AAPL');
  const [showDownloads, setShowDownloads] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Advanced Chart (Desktop) ───────────────────────────────
  useEffect(() => {
    if (!chartRef.current || !isMounted || !isDesktop) return;
    loadTradingViewWidget(
      chartRef.current,
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',
      {
        autosize: true,
        symbol: activeSymbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        backgroundColor: 'rgba(0, 0, 0, 1)',
        gridColor: 'rgba(30, 30, 30, 0.15)',
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: true,
        save_image: true,
        calendar: false,
        hide_volume: false,
        support_host: 'https://www.tradingview.com',
        withdateranges: true,
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        overrides: {
          'mainSeriesProperties.candleStyle.upColor': '#2962FF',
          'mainSeriesProperties.candleStyle.borderUpColor': '#2962FF',
          'mainSeriesProperties.candleStyle.wickUpColor': '#2962FF',
          'mainSeriesProperties.candleStyle.downColor': '#F23645',
          'mainSeriesProperties.candleStyle.borderDownColor': '#F23645',
          'mainSeriesProperties.candleStyle.wickDownColor': '#F23645',
          'mainSeriesProperties.hollowCandleStyle.upColor': '#2962FF',
          'mainSeriesProperties.hollowCandleStyle.borderUpColor': '#2962FF',
          'mainSeriesProperties.hollowCandleStyle.wickUpColor': '#2962FF',
        },
      }
    );
  }, [activeSymbol, isMounted, isDesktop]);

  // ── Advanced Chart (Mobile) ────────────────────────────────
  useEffect(() => {
    if (!mobileChartRef.current || !isMounted || isDesktop) return;
    loadTradingViewWidget(
      mobileChartRef.current,
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',
      {
        autosize: true,
        symbol: activeSymbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        backgroundColor: 'rgba(0, 0, 0, 1)',
        gridColor: 'rgba(30, 30, 30, 0.15)',
        hide_top_toolbar: true,
        hide_legend: true,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        hide_volume: false,
        support_host: 'https://www.tradingview.com',
        overrides: {
          'mainSeriesProperties.candleStyle.upColor': '#2962FF',
          'mainSeriesProperties.candleStyle.borderUpColor': '#2962FF',
          'mainSeriesProperties.candleStyle.wickUpColor': '#2962FF',
          'mainSeriesProperties.candleStyle.downColor': '#F23645',
          'mainSeriesProperties.candleStyle.borderDownColor': '#F23645',
          'mainSeriesProperties.candleStyle.wickDownColor': '#F23645',
          'mainSeriesProperties.hollowCandleStyle.upColor': '#2962FF',
          'mainSeriesProperties.hollowCandleStyle.borderUpColor': '#2962FF',
          'mainSeriesProperties.hollowCandleStyle.wickUpColor': '#2962FF',
        },
      }
    );
  }, [activeSymbol, isMounted, isDesktop]);

  // ── Market Overview Widget (Desktop right panel) ───────────
  useEffect(() => {
    if (!watchlistRef.current || !isMounted || !isDesktop) return;
    loadTradingViewWidget(
      watchlistRef.current,
      'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js',
      {
        colorTheme: 'dark',
        dateRange: '1D',
        showChart: true,
        locale: 'en',
        largeChartUrl: '',
        isTransparent: false,
        showSymbolLogo: true,
        showFloatingTooltip: true,
        width: '100%',
        height: '100%',
        plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
        plotLineColorFalling: 'rgba(255, 77, 92, 1)',
        gridLineColor: 'rgba(30, 30, 30, 0)',
        scaleFontColor: 'rgba(209, 212, 220, 1)',
        belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
        belowLineFillColorFalling: 'rgba(255, 77, 92, 0.12)',
        belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
        belowLineFillColorFallingBottom: 'rgba(255, 77, 92, 0)',
        symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
        tabs: MARKET_OVERVIEW_TABS,
      }
    );
  }, [isMounted, isDesktop]);

  // ── Market Overview Widget (Mobile) ────────────────────────
  useEffect(() => {
    if (!mobileWatchlistRef.current || !isMounted || isDesktop) return;
    loadTradingViewWidget(
      mobileWatchlistRef.current,
      'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js',
      {
        colorTheme: 'dark',
        dateRange: '1D',
        showChart: true,
        locale: 'en',
        largeChartUrl: '',
        isTransparent: false,
        showSymbolLogo: true,
        showFloatingTooltip: true,
        width: '100%',
        height: '100%',
        plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
        plotLineColorFalling: 'rgba(255, 77, 92, 1)',
        gridLineColor: 'rgba(30, 30, 30, 0)',
        scaleFontColor: 'rgba(209, 212, 220, 1)',
        belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
        belowLineFillColorFalling: 'rgba(255, 77, 92, 0.12)',
        belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
        belowLineFillColorFallingBottom: 'rgba(255, 77, 92, 0)',
        symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
        tabs: MARKET_OVERVIEW_TABS,
      }
    );
  }, [isMounted, isDesktop]);

  // ── Ticker Tape (top scrolling bar) ────────────────────────
  useEffect(() => {
    if (!tickerRef.current || !isMounted) return;
    loadTradingViewWidget(
      tickerRef.current,
      'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js',
      {
        symbols: TICKER_SYMBOLS,
        showSymbolLogo: true,
        isTransparent: false,
        displayMode: 'adaptive',
        colorTheme: 'dark',
        locale: 'en',
      }
    );
  }, [isMounted]);

  // ── Symbol Info (bottom detail panel) ──────────────────────
  useEffect(() => {
    if (!detailRef.current || !isMounted) return;
    loadTradingViewWidget(
      detailRef.current,
      'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js',
      {
        symbol: activeSymbol,
        width: '100%',
        isTransparent: false,
        colorTheme: 'dark',
        locale: 'en',
      }
    );
  }, [activeSymbol, isMounted]);

  if (!isMounted) return null;

  const tvFooter = (
    <div className="flex items-center justify-center px-4 py-2 bg-black border-t border-[#1a1a1a]">
      <a
        href="https://www.tradingview.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-[#6a6d78] hover:text-blue-400 flex items-center gap-1.5 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 36 28" fill="currentColor">
          <path d="M14 22H7V6h7v16zM21 22h-5V0h5v22zM28 22h-5V11h5v11z" />
        </svg>
        Powered by TradingView
        <ExternalLink size={10} />
      </a>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ════════════════════════════════════════════════════════════
  if (!isDesktop) {
    return (
      <div className="w-full bg-black text-[#d1d4dc] font-sans select-none rounded-xl border border-[#1a1a1a]">
        {/* ── Branded Header ── */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <TVLogo size={28} />
            <span className="text-[15px] font-semibold tracking-wide text-white">TradingView</span>
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-400/80 font-medium">Connected</span>
            </div>
          </div>
          <TVDownloadToggle isOpen={showDownloads} onToggle={() => setShowDownloads(!showDownloads)} />
        </div>

        {/* Ticker Tape */}
        <div
          ref={tickerRef}
          className="tradingview-widget-container w-full"
          style={{ height: 46 }}
        />

        {/* Chart — full viewport height, with touch passthrough overlay */}
        <div
          className="w-full border-t border-[#1a1a1a] relative"
          style={{ height: 'calc(100vh - 90px)' }}
        >
          <div
            ref={mobileChartRef}
            className="tradingview-widget-container w-full h-full"
          />
          {/* Transparent overlay — allows page scroll, tap to interact with chart */}
          <div
            className="absolute inset-0 z-[1]"
            onTouchStart={(e) => {
              // Remove overlay on tap so user can interact with chart
              const target = e.currentTarget;
              target.style.display = 'none';
              // Restore after 3s of inactivity
              setTimeout(() => { target.style.display = ''; }, 3000);
            }}
          />
        </div>

        {/* Symbol Detail — compact strip */}
        <div
          className="border-t border-[#1a1a1a] w-full overflow-hidden"
          style={{ height: 100 }}
        >
          <div ref={detailRef} className="tradingview-widget-container w-full h-full" />
        </div>

        {/* Market Overview — full width, scrollable watchlist */}
        <div
          className="border-t border-[#1a1a1a] w-full overflow-hidden"
          style={{ height: 360 }}
        >
          <div
            ref={mobileWatchlistRef}
            className="tradingview-widget-container w-full h-full"
          />
        </div>

        {tvFooter}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT — Exact TradingView replica
  // ════════════════════════════════════════════════════════════
  return (
    <div
      className={`w-full bg-black text-[#d1d4dc] font-sans select-none overflow-hidden border border-[#1a1a1a] ${
        isFullscreen
          ? 'fixed inset-0 z-[100] rounded-none'
          : 'rounded-xl'
      }`}
      style={isFullscreen ? undefined : { height: '85vh', minHeight: 740, maxHeight: 1050 }}
    >
      {/* ── Branded Header ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <TVLogo size={32} />
          <h2 className="text-[18px] font-bold tracking-wide text-white">TradingView</h2>
          <div className="flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full bg-green-500/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] text-green-400 font-medium">Connected</span>
          </div>
        </div>
        <TVDownloadToggle isOpen={showDownloads} onToggle={() => setShowDownloads(!showDownloads)} />
      </div>

      {/* ── Top Ticker Tape ── */}
      <div
        ref={tickerRef}
        className="tradingview-widget-container w-full border-b border-[#1a1a1a]"
        style={{ height: 46, backgroundColor: '#000000' }}
      />

      {/* ── Main Layout: Chart + Watchlist ── */}
      <div
        className="flex"
        style={{ height: isFullscreen ? 'calc(100vh - 86px)' : 'calc(100% - 86px)' }}
      >
        {/* ── LEFT: Advanced Chart ── */}
        <div className="flex-1 min-w-0 relative">
          <div
            ref={chartRef}
            className="tradingview-widget-container w-full h-full"
          />

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-3 right-3 z-10 p-2 bg-black/80 hover:bg-[#1a1a1a] rounded-lg transition-colors text-[#6a6d78] hover:text-white backdrop-blur-sm"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 size={16} />
            ) : (
              <Maximize2 size={16} />
            )}
          </button>
        </div>

        {/* ── RIGHT: Market Overview (Watchlist + mini chart) ── */}
        <div className="w-[360px] flex-shrink-0 border-l border-[#1a1a1a] flex flex-col bg-black">
          {/* Market Overview Widget */}
          <div className="flex-1 min-h-0">
            <div
              ref={watchlistRef}
              className="tradingview-widget-container w-full h-full"
            />
          </div>

          {/* Symbol Detail */}
          <div
            className="border-t border-[#1a1a1a] shrink-0"
            style={{ height: 180, minHeight: 180 }}
          >
            <div
              ref={detailRef}
              className="tradingview-widget-container w-full"
            />
          </div>

          {tvFooter}
        </div>
      </div>
    </div>
  );
}
