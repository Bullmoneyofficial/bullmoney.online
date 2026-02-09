'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useUnifiedPerformance } from '@/hooks/useDesktopPerformance';
import {
  Menu,
  Pencil,
  Plus,
  Search,
  ArrowUpDown,
  CandlestickChart,
  History,
  Settings,
  TrendingUp,
  Signal,
  Wifi,
  ChevronDown,
  X,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Clock,
  Zap,
  Check,
  Minus,
  Loader2,
  Globe,
  Coins,
  Gem,
  ExternalLink,
  Smartphone,
  Monitor,
  ChevronRight,
  Apple,
} from 'lucide-react';
import { useLiveQuotes, LiveQuote } from '@/lib/quotes/useLiveQuotes';
import { ALL_INSTRUMENTS, INSTRUMENTS_BY_TYPE, Instrument } from '@/lib/quotes/instruments';

// ─── MetaTrader 5 Logo ───────────────────────────────────────
const MT5Logo = ({ size = 24 }: { size?: number }) => (
  <img
    src="https://www.metatrader5.com/i/metatrader-5-logo_2x.png"
    alt="MetaTrader 5"
    width={size}
    height={size}
    className="object-contain flex-shrink-0"
    draggable={false}
  />
);

// ─── MT5 Download Links Toggle ───────────────────────────────
const MT5_LINKS = [
  { label: 'iPhone / iPad', href: 'https://download.mql5.com/cdn/mobile/mt5/ios?server=MetaQuotes-Demo', icon: 'apple' as const },
  { label: 'Android', href: 'https://download.mql5.com/cdn/mobile/mt5/android?server=MetaQuotes-Demo', icon: 'phone' as const },
  { label: 'Windows', href: 'https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe', icon: 'desktop' as const },
  { label: 'macOS', href: 'https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/MetaTrader5.dmg', icon: 'desktop' as const },
  { label: 'Web Terminal', href: 'https://trade.metatrader5.com/terminal', icon: 'web' as const },
  { label: 'Linux', href: 'https://www.metatrader5.com/en/terminal/help/start_advanced/install_linux', icon: 'desktop' as const },
];

const MT5DownloadToggle = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
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
            <span className="text-[10px] text-[#555] font-medium uppercase tracking-wider">Download MetaTrader 5</span>
          </div>
          {MT5_LINKS.map((link) => (
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
                <span className="text-[13px] text-white group-hover:text-blue-400 transition-colors">{link.label}</span>
              </div>
              <ChevronRight size={12} className="ml-auto text-[#333] group-hover:text-[#555]" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TradingView symbol mapping ──────────────────────────────
function toTradingViewSymbol(symbol: string, category: string): string {
  // Crypto → BINANCE:BTCUSDT
  if (category === 'Crypto') {
    const base = symbol.replace(/USD$/, '');
    return `BINANCE:${base}USDT`;
  }
  // Metals
  if (symbol === 'XAUUSD') return 'OANDA:XAUUSD';
  if (symbol === 'XAGUSD') return 'OANDA:XAGUSD';
  if (symbol === 'XPTUSD') return 'TVC:PLATINUM';
  if (symbol === 'XPDUSD') return 'TVC:PALLADIUM';
  // Indices
  if (category === 'Indices') {
    const indexMap: Record<string, string> = {
      US100: 'NASDAQ:NDX',
      US30: 'DJ:DJI',
      US500: 'SP:SPX',
      DE40: 'XETR:DAX',
      UK100: 'SPREADEX:FTSE',
      JP225: 'TVC:NI225',
    };
    return indexMap[symbol] || `TVC:${symbol}`;
  }
  // Forex
  return `FX:${symbol}`;
}

// ─── TradingView Chart Modal (MT5 style) ─────────────────────
const ChartModal = ({
  quote,
  onClose,
  isDesktop,
}: {
  quote: LiveQuote;
  onClose: () => void;
  isDesktop: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = toTradingViewSymbol(quote.symbol, quote.category);
  const isPositive = quote.changePercent >= 0;
  const [timeframe, setTimeframe] = useState('15');

  const timeframes = [
    { label: 'M1', value: '1' },
    { label: 'M5', value: '5' },
    { label: 'M15', value: '15' },
    { label: 'H1', value: '60' },
    { label: 'H4', value: '240' },
    { label: 'D1', value: 'D' },
    { label: 'W1', value: 'W' },
    { label: 'MN', value: 'M' },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: timeframe,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#000000',
      gridColor: 'rgba(255,255,255,0.04)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });
    containerRef.current.appendChild(script);
  }, [tvSymbol, timeframe]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <div
        className={`flex flex-col bg-black w-full ${isDesktop ? 'max-w-5xl rounded-xl border border-[#1a1a1a] overflow-hidden h-[90vh]' : 'h-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MT5-style header bar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a0a] border-b border-[#1a1a1a] shrink-0">
          {/* Left: symbol info */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="p-1 -ml-1 text-[#888] hover:text-white transition-colors">
              <ArrowDown size={18} className="rotate-90" />
            </button>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-white font-bold text-[16px] truncate">{quote.symbol}</span>
              <span className="text-[#555] text-[11px]">{quote.suffix}</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tabular-nums ${
              isPositive ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              <span>{quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%</span>
            </div>
          </div>

          {/* Center: price */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className={`text-[15px] font-semibold tabular-nums ${isPositive ? 'text-blue-400' : 'text-red-400'}`}>
                {quote.bid.toFixed(quote.digits)}
              </span>
              <span className="text-[10px] text-[#555] tabular-nums">Bid</span>
            </div>
            <div className="w-px h-6 bg-[#1e1e1e]" />
            <div className="flex flex-col items-start">
              <span className={`text-[15px] font-semibold tabular-nums ${isPositive ? 'text-blue-400' : 'text-red-400'}`}>
                {quote.ask.toFixed(quote.digits)}
              </span>
              <span className="text-[10px] text-[#555] tabular-nums">Ask</span>
            </div>
            <span className="text-[10px] text-[#444] tabular-nums">Spd: {quote.spread}</span>
          </div>

          {/* Right: close */}
          <button onClick={onClose} className="p-1.5 hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <X size={18} className="text-[#888]" />
          </button>
        </div>

        {/* ── Timeframe tabs (MT5 style) ── */}
        <div className="flex items-center gap-0.5 px-3 py-1.5 bg-[#060606] border-b border-[#141414] overflow-x-auto shrink-0">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                timeframe === tf.value
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-[#666] hover:text-[#999] hover:bg-[#111]'
              }`}
            >
              {tf.label}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-[10px] text-[#444] tabular-nums">
            <span>H: {quote.high.toFixed(quote.digits)}</span>
            <span className="opacity-40">·</span>
            <span>L: {quote.low.toFixed(quote.digits)}</span>
            <span className="opacity-40">·</span>
            <span>Vol: {quote.volume}</span>
          </div>
        </div>

        {/* ── TradingView widget ── */}
        <div className="flex-1 min-h-0">
          <div ref={containerRef} className="tradingview-widget-container w-full h-full" />
        </div>

        {/* ── Bottom info bar ── */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#060606] border-t border-[#141414] shrink-0">
          <div className="flex items-center gap-3 text-[10px] text-[#555] tabular-nums">
            <span>Open: {quote.open.toFixed(quote.digits)}</span>
            <span className="opacity-40">|</span>
            <span>Low: {quote.low.toFixed(quote.digits)}</span>
            <span className="opacity-40">|</span>
            <span>High: {quote.high.toFixed(quote.digits)}</span>
          </div>
          <span className="text-[10px] text-[#444] tabular-nums">{quote.time} UTC</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Helpers ---

/** Simulated mini-sparkline SVG (deterministic per symbol) */
const MiniSparkline = ({ symbol, color, width = 80, height = 28 }: { symbol: string; color: string; width?: number; height?: number }) => {
  const hash = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const points: number[] = [];
  let seed = hash;
  for (let i = 0; i < 20; i++) {
    seed = (seed * 16807 + 7) % 2147483647;
    points.push((seed % 1000) / 1000);
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const normalized = points.map((p) => (p - min) / range);

  const pathD = normalized
    .map((v, i) => {
      const x = (i / (normalized.length - 1)) * width;
      const y = height - v * height * 0.85 - height * 0.075;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <path d={pathD} fill="none" stroke={color === 'blue' ? '#3b82f6' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/** Daily range bar: shows where current price sits between Low and High */
const DailyRangeBar = ({ low, high, current, color }: { low: number; high: number; current: number; color: string }) => {
  const range = high - low || 1;
  const pct = Math.max(0, Math.min(100, ((current - low) / range) * 100));
  const barColor = color === 'blue' ? 'bg-blue-500' : 'bg-red-500';
  const trackColor = 'bg-[#1e1e1e]';

  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className={`h-[3px] rounded-full ${trackColor} w-full overflow-hidden`}>
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// --- Broker-Style Animated Price Display (RAF-driven, zero React overhead) ---
const BrokerPriceDisplay = React.memo(function BrokerPriceDisplay({
  price,
  digits,
  pipette,
  color,
  size = 'normal',
  symbol,
}: {
  price: number;
  digits: number;
  pipette: boolean;
  color: string;
  size?: 'normal' | 'large';
  symbol: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const realPriceRef = useRef(price);
  const prevCharsRef = useRef('');
  const rafIdRef = useRef(0);

  // Always keep latest real price accessible to the RAF loop
  realPriceRef.current = price;

  const s = size === 'large'
    ? { small: '19px', big: '30px', sup: '15px' }
    : { small: '17px', big: '26px', sup: '14px' };

  // RAF-driven micro-tick loop: simulates broker-speed digit flickering
  // Uses direct DOM manipulation — zero React re-renders in the hot path
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pipSz = Math.pow(10, -digits);
    let lastT = 0;
    // Stagger interval per symbol for natural desync across instruments
    const INTERVAL = 55 + (symbol.charCodeAt(0) % 35);

    const loop = (now: number) => {
      if (now - lastT >= INTERVAL) {
        lastT = now;
        const real = realPriceRef.current;
        // Jitter last 1-2 digits ±0-2 pips — mimics real broker tick stream
        const jitter = (Math.random() - 0.5) * 2.5 * pipSz;
        const str = (real + jitter).toFixed(digits);

        if (str !== prevCharsRef.current) {
          const prev = prevCharsRef.current;
          prevCharsRef.current = str;
          const spans = container.querySelectorAll<HTMLSpanElement>('.dgt');
          for (let i = 0; i < spans.length && i < str.length; i++) {
            if (str[i] !== prev[i]) {
              spans[i].textContent = str[i];
              // GPU-composited flash: opacity + transform only (no layout thrash)
              spans[i].animate(
                [
                  { opacity: 0.5, transform: 'scale(1.12)' },
                  { opacity: 1, transform: 'scale(1)' },
                ],
                { duration: 110, easing: 'ease-out' }
              );
            }
          }
        }
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };

    prevCharsRef.current = realPriceRef.current.toFixed(digits);
    rafIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [digits, symbol, pipette]);

  // Build initial digit structure — React only renders this once per real data change
  const priceStr = price.toFixed(digits);
  let smallPre: string, bigMid: string, superPost: string;
  if (pipette) {
    superPost = priceStr.slice(-1);
    bigMid = priceStr.slice(-3, -1);
    smallPre = priceStr.slice(0, -3);
  } else {
    bigMid = priceStr.slice(-2);
    smallPre = priceStr.slice(0, -2);
    superPost = '';
  }

  const hexColor = color === 'blue' ? '#3b82f6' : '#ef4444';

  return (
    <div ref={containerRef} className="flex items-baseline font-medium tabular-nums" style={{ color: hexColor }}>
      {smallPre.split('').map((ch, i) => (
        <span key={i} className="dgt" style={{ fontSize: s.small }}>{ch}</span>
      ))}
      {bigMid.split('').map((ch, i) => (
        <span key={`m${i}`} className="dgt" style={{ fontSize: s.big, lineHeight: 1, margin: '0 0.5px', fontWeight: 600 }}>{ch}</span>
      ))}
      {superPost && (
        <span className="dgt" style={{ fontSize: s.sup, marginTop: '-8px' }}>{superPost}</span>
      )}
    </div>
  );
});

// --- Mobile Quote Row (pixel-perfect MT5 iOS) ---
const QuoteRowMobile = React.memo(({ data, editMode, onRemove, onTap }: { data: LiveQuote; editMode?: boolean; onRemove?: (s: string) => void; onTap?: (q: LiveQuote) => void }) => {
  const isPositive = data.change >= 0;
  const changeColor = isPositive ? 'text-[#3b82f6]' : 'text-[#ef4444]';

  return (
    <div
      className="flex justify-between items-center py-3 border-b border-[#1a1a1a] bg-black px-4 active:bg-[#111] transition-colors cursor-pointer"
      onClick={() => !editMode && onTap?.(data)}
    >
      {/* Edit mode delete button */}
      {editMode && (
        <button onClick={() => onRemove?.(data.symbol)} className="mr-3 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <Minus size={14} className="text-red-500" />
        </button>
      )}
      {/* LEFT: Symbol info */}
      <div className="flex flex-col w-[35%] min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span className={`${changeColor} text-[11px] tabular-nums`}>
            {isPositive ? '+' : ''}
            {data.change.toFixed(data.digits)}
          </span>
          <span className={`${changeColor} text-[11px] tabular-nums`}>{data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
        </div>

        <div className="flex items-baseline mb-0.5">
          <span className="text-white font-bold text-[17px] leading-tight mr-0.5 truncate">{data.symbol}</span>
          <span className="text-[#9ca3af] font-normal text-[12px]">{data.suffix}</span>
        </div>

        <div className="flex items-center text-[#555] text-[11px] tabular-nums gap-1">
          <Clock size={10} className="opacity-60" />
          <span>{data.time}</span>
          <span className="mx-0.5 opacity-40">·</span>
          <Zap size={9} className="opacity-60" />
          <span>{data.spread}</span>
        </div>
      </div>

      {/* RIGHT: Bid / Ask prices */}
      <div className="flex flex-1 justify-end gap-3">
        {/* Bid */}
        <div className="flex flex-col items-end">
          <BrokerPriceDisplay price={data.bid} digits={data.digits} pipette={data.pipette} color={data.color} symbol={data.symbol} />
          <div className="text-[#555] text-[10px] tabular-nums mt-0.5">
            L: {data.low.toFixed(data.digits)}
          </div>
        </div>

        {/* Ask */}
        <div className="flex flex-col items-end">
          <BrokerPriceDisplay price={data.ask} digits={data.digits} pipette={data.pipette} color={data.color} symbol={data.symbol} />
          <div className="text-[#555] text-[10px] tabular-nums mt-0.5">
            H: {data.high.toFixed(data.digits)}
          </div>
        </div>
      </div>
    </div>
  );
});

// --- Desktop Quote Row (expanded with extra columns) ---
const QuoteRowDesktop = React.memo(({ data, isHovered, editMode, onRemove, onTap }: { data: LiveQuote; isHovered: boolean; editMode?: boolean; onRemove?: (s: string) => void; onTap?: (q: LiveQuote) => void }) => {
  const isPositive = data.change >= 0;
  const changeColor = isPositive ? 'text-[#3b82f6]' : 'text-[#ef4444]';
  const changeBg = isPositive ? 'bg-blue-500/10' : 'bg-red-500/10';
  const arrowIcon = isPositive ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  const midPrice = (data.bid + data.ask) / 2;

  return (
    <div
      className={`grid grid-cols-[${editMode ? '40px_' : ''}minmax(160px,1.2fr)_1fr_1fr_100px_120px_100px_90px_80px] items-center py-2.5 border-b border-[#141414] px-5 transition-colors cursor-pointer ${
        isHovered ? 'bg-[#0d0d0d]' : 'bg-black'
      }`}
      onClick={() => !editMode && onTap?.(data)}
    >
      {/* Edit mode delete */}
      {editMode && (
        <button onClick={() => onRemove?.(data.symbol)} className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <Minus size={14} className="text-red-500" />
        </button>
      )}
      {/* Symbol */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-white font-bold text-[15px] truncate">{data.symbol}</span>
            <span className="text-[#666] text-[11px]">{data.suffix}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#555] text-[10px] tabular-nums mt-0.5">
            <span>{data.time}</span>
            <span className="opacity-40">·</span>
            <span>Spd: {data.spread}</span>
            {data.category && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-[#444]">{data.category}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bid */}
      <div className="flex justify-end">
        <BrokerPriceDisplay price={data.bid} digits={data.digits} pipette={data.pipette} color={data.color} symbol={data.symbol} size="normal" />
      </div>

      {/* Ask */}
      <div className="flex justify-end">
        <BrokerPriceDisplay price={data.ask} digits={data.digits} pipette={data.pipette} color={data.color} symbol={data.symbol} size="normal" />
      </div>

      {/* Change */}
      <div className="flex justify-end">
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${changeBg} ${changeColor} text-[12px] font-medium tabular-nums`}>
          {arrowIcon}
          <span>{data.changePercent > 0 ? '+' : ''}{data.changePercent}%</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="flex justify-center">
        <MiniSparkline symbol={data.symbol} color={data.color} width={90} height={24} />
      </div>

      {/* Daily Range */}
      <div className="flex flex-col items-center gap-0.5 px-2">
        <DailyRangeBar low={data.low} high={data.high} current={midPrice} color={data.color} />
        <div className="flex justify-between w-full text-[9px] text-[#444] tabular-nums">
          <span>{data.low.toFixed(data.digits > 3 ? 2 : data.digits)}</span>
          <span>{data.high.toFixed(data.digits > 3 ? 2 : data.digits)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex justify-end">
        <span className="text-[#666] text-[12px] tabular-nums">{data.volume}</span>
      </div>

      {/* Low / High */}
      <div className="flex flex-col items-end text-[10px] tabular-nums text-[#555]">
        <span>L: {data.low.toFixed(data.digits)}</span>
        <span>H: {data.high.toFixed(data.digits)}</span>
      </div>
    </div>
  );
});

// --- Desktop Header Row ---
const DesktopHeaderRow = () => (
  <div className="grid grid-cols-[minmax(160px,1.2fr)_1fr_1fr_100px_120px_100px_90px_80px] items-center py-2 px-5 border-b border-[#1a1a1a] text-[11px] text-[#555] font-medium uppercase tracking-wider bg-[#060606] sticky top-0 z-10">
    <span>Symbol</span>
    <span className="text-right">Bid</span>
    <span className="text-right">Ask</span>
    <span className="text-right">Change</span>
    <span className="text-center">Trend</span>
    <span className="text-center">Range</span>
    <span className="text-right">Volume</span>
    <span className="text-right">L / H</span>
  </div>
);

// --- iOS Status Bar ---
const IOSStatusBar = () => (
  <div className="flex justify-between items-center px-6 pt-3 pb-1 text-[15px] font-semibold text-white">
    <span className="tabular-nums w-12">01:20</span>
    <div className="absolute left-1/2 -translate-x-1/2 w-[125px] h-[34px] bg-black rounded-b-[22px]" />
    <div className="flex items-center gap-1">
      <Signal size={15} className="fill-white" />
      <Wifi size={15} />
      {/* Battery */}
      <div className="flex items-center gap-[2px]">
        <div className="w-[22px] h-[11px] border border-white/80 rounded-[3px] relative flex items-center px-[2px]">
          <div className="h-[7px] w-[14px] bg-white rounded-[1px]" />
        </div>
        <div className="w-[1.5px] h-[4px] bg-white/80 rounded-r-sm" />
      </div>
    </div>
  </div>
);

// --- Mobile Bottom Nav ---
const BottomNav = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (t: string) => void }) => {
  const tabs = [
    { id: 'quotes', label: 'Quotes', icon: ArrowUpDown },
    { id: 'chart', label: 'Chart', icon: CandlestickChart },
    { id: 'trade', label: 'Trade', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="bg-[#0a0a0a] border-t border-[#1a1a1a] flex justify-around items-center px-1 pt-2 pb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 w-1/5 transition-colors ${
              isActive ? 'text-[#3b82f6]' : 'text-[#555]'
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- Desktop Sidebar Nav ---
const DesktopSidebar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (t: string) => void }) => {
  const tabs = [
    { id: 'quotes', label: 'Quotes', icon: ArrowUpDown },
    { id: 'chart', label: 'Chart', icon: CandlestickChart },
    { id: 'trade', label: 'Trade', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-[72px] bg-[#0a0a0a] border-r border-[#141414] flex flex-col items-center py-4 gap-1 flex-shrink-0">
      {/* Logo area */}
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center mb-4">
        <BarChart3 size={20} className="text-white" />
      </div>

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg w-[58px] transition-all ${
              isActive ? 'text-[#3b82f6] bg-blue-500/10' : 'text-[#555] hover:text-[#888] hover:bg-[#111]'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[9px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- Search Bar (Desktop) ---
const DesktopSearchBar = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="relative flex items-center">
    <Search size={14} className="absolute left-3 text-[#555]" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search symbols..."
      className="bg-[#111] border border-[#1e1e1e] rounded-lg pl-9 pr-8 py-1.5 text-[13px] text-white placeholder-[#444] w-56 focus:outline-none focus:border-[#333] transition-colors"
    />
    {value && (
      <button onClick={() => onChange('')} className="absolute right-2.5 text-[#555] hover:text-white">
        <X size={12} />
      </button>
    )}
  </div>
);

// ============================================================
// INSTRUMENT PICKER MODAL
// ============================================================
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Crypto: <Coins size={16} />,
  Forex: <Globe size={16} />,
  Metals: <Gem size={16} />,
  Indices: <BarChart3 size={16} />,
};

function InstrumentPicker({
  open,
  onClose,
  watchlist,
  onAdd,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  watchlist: string[];
  onAdd: (s: string) => void;
  onRemove: (s: string) => void;
}) {
  const [pickerSearch, setPickerSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'crypto' | 'forex' | 'metal' | 'index'>('all');

  const categories = [
    { id: 'all' as const, label: 'All', count: ALL_INSTRUMENTS.length },
    { id: 'crypto' as const, label: 'Crypto', count: INSTRUMENTS_BY_TYPE.crypto.length },
    { id: 'forex' as const, label: 'Forex', count: INSTRUMENTS_BY_TYPE.forex.length },
    { id: 'metal' as const, label: 'Metals', count: INSTRUMENTS_BY_TYPE.metal.length },
    { id: 'index' as const, label: 'Indices', count: INSTRUMENTS_BY_TYPE.index.length },
  ];

  const filtered = useMemo(() => {
    let list = activeCategory === 'all' ? ALL_INSTRUMENTS : INSTRUMENTS_BY_TYPE[activeCategory];
    if (pickerSearch) {
      const q = pickerSearch.toLowerCase();
      list = list.filter(
        (i) =>
          i.symbol.toLowerCase().includes(q) ||
          i.displayName.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, pickerSearch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <h2 className="text-white text-[17px] font-semibold">Add Instruments</h2>
        <button onClick={onClose} className="p-1.5 text-[#888] hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Search instruments..."
            autoFocus
            className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg pl-9 pr-4 py-2.5 text-[14px] text-white placeholder-[#444] focus:outline-none focus:border-[#333]"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-[#111] text-[#666] border border-[#1e1e1e] hover:text-[#999]'
            }`}
          >
            {cat.id !== 'all' && CATEGORY_ICONS[cat.label]}
            {cat.label}
            <span className="text-[10px] opacity-60">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Instrument list */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {filtered.map((instrument) => {
          const isAdded = watchlist.includes(instrument.symbol);
          return (
            <div
              key={instrument.symbol}
              className="flex items-center justify-between px-4 py-3 border-b border-[#0e0e0e] hover:bg-[#0a0a0a] transition-colors"
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-white font-semibold text-[14px]">{instrument.symbol}</span>
                  <span className="text-[#555] text-[11px]">{instrument.suffix}</span>
                </div>
                <span className="text-[#555] text-[11px] mt-0.5 truncate">{instrument.displayName}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  instrument.type === 'crypto' ? 'bg-blue-500/10 text-blue-400' :
                  instrument.type === 'forex' ? 'bg-green-500/10 text-green-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {instrument.category}
                </span>
                <button
                  onClick={() => (isAdded ? onRemove(instrument.symbol) : onAdd(instrument.symbol))}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isAdded
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-[#1a1a1a] text-[#666] hover:text-white hover:bg-[#222]'
                  }`}
                >
                  {isAdded ? <Check size={16} /> : <Plus size={16} />}
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[#444]">
            <Search size={28} className="mb-2 opacity-50" />
            <span className="text-[13px]">No instruments match your search</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1a1a1a] text-center">
        <span className="text-[11px] text-[#555]">{watchlist.length} instruments in watchlist</span>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MetaTraderQuotes({ embedded = false }: { embedded?: boolean }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('quotes');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [chartQuote, setChartQuote] = useState<LiveQuote | null>(null);
  const [showMT5Links, setShowMT5Links] = useState(false);
  
  // Performance detection
  const { isMobile, isTablet, shouldSkipHeavyEffects } = useUnifiedPerformance();
  const isMobileDevice = isMobile || isTablet;

  const { quotes, watchlist, addSymbol, removeSymbol, connected } = useLiveQuotes();

  useEffect(() => {
    setIsMounted(true);
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Live UTC clock (update less frequently on mobile)
  useEffect(() => {
    const tick = () => setUtcTime(new Date().toISOString().slice(11, 19));
    tick();
    const interval = isMobileDevice ? 2000 : 1000; // 2s on mobile, 1s on desktop
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [isMobileDevice]);

  const filteredQuotes = useMemo(
    () =>
      quotes.filter(
        (q) =>
          q.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [quotes, searchQuery]
  );

  // Loading state when no quotes yet
  const isLoading = quotes.length === 0 && watchlist.length > 0;

  if (!isMounted) return null;

  // ======================
  // MOBILE LAYOUT (MT5 iOS)
  // ======================
  if (!isDesktop) {
    return (
      <div className={`flex flex-col w-full bg-black text-white font-sans select-none ${embedded ? 'max-w-full min-h-[420px] lg:min-h-[calc(100vh-220px)]' : 'h-[100dvh] max-w-md mx-auto overflow-hidden'}`}>
        {/* iOS Status Bar - only in standalone mode */}
        {!embedded && <IOSStatusBar />}

        {/* App Header */}
        <div className="flex justify-between items-center px-4 py-2">
          <button className="p-1.5 -ml-1.5 active:opacity-50 transition-opacity">
            <Menu className="text-[#ccc] w-[22px] h-[22px]" />
          </button>

          <div className="flex items-center gap-2">
            <MT5Logo size={80} />
            <span className="text-[17px] font-semibold tracking-wide text-white">MetaTrader</span>
            {connected ? (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-red-500" />
            )}
            <MT5DownloadToggle isOpen={showMT5Links} onToggle={() => setShowMT5Links(!showMT5Links)} />
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`active:opacity-50 transition-opacity ${editMode ? 'text-blue-400' : 'text-white'}`}
            >
              <Pencil className="w-[18px] h-[18px]" />
            </button>
            <button onClick={() => setShowPicker(true)} className="active:opacity-50 transition-opacity">
              <Plus className="w-[20px] h-[20px] text-white" />
            </button>
          </div>
        </div>

        {/* Search bar for mobile */}
        {editMode && (
          <div className="px-4 pb-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter instruments..."
                className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg pl-8 pr-4 py-2 text-[13px] text-white placeholder-[#444] focus:outline-none focus:border-[#333]"
              />
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 size={28} className="text-blue-500 animate-spin" />
            <span className="text-[#555] text-[13px]">Connecting to markets...</span>
          </div>
        )}

        {/* Quote List — embedded: natural flow (page scrolls), standalone: internal scroll */}
        {!isLoading && (
          <div className={embedded ? '' : 'flex-1 overflow-y-auto overscroll-contain'} style={embedded ? undefined : { WebkitOverflowScrolling: 'touch' }}>
            {filteredQuotes.map((quote) => (
              <QuoteRowMobile key={quote.symbol} data={quote} editMode={editMode} onRemove={removeSymbol} onTap={setChartQuote} />
            ))}
            {filteredQuotes.length === 0 && quotes.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[#444]">
                <Search size={24} className="mb-2 opacity-50" />
                <span className="text-[13px]">No matches</span>
              </div>
            )}
            <div className="h-2" />
          </div>
        )}

        {/* Bottom Tab Bar - only in standalone mode */}
        {!embedded && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}

        {/* Chart Modal */}
        {chartQuote && (
          <ChartModal quote={chartQuote} onClose={() => setChartQuote(null)} isDesktop={false} />
        )}

        {/* Instrument Picker Modal */}
        <InstrumentPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          watchlist={watchlist}
          onAdd={addSymbol}
          onRemove={removeSymbol}
        />
      </div>
    );
  }

  // ======================
  // DESKTOP LAYOUT
  // ======================
  return (
    <div className={`flex w-full bg-black text-white font-sans select-none ${embedded ? 'flex-col min-h-[520px] lg:min-h-[calc(100vh-220px)]' : 'h-[100dvh] overflow-hidden'}`}>
      {/* Sidebar - only in standalone mode */}
      {!embedded && <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />}

      {/* Main Content */}
      <div className={`flex flex-col ${embedded ? '' : 'flex-1'} min-w-0`}>
        {/* Desktop Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#060606] border-b border-[#141414]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <MT5Logo size={96} />
              <h1 className="text-[20px] font-bold tracking-wide">MetaTrader</h1>
              <MT5DownloadToggle isOpen={showMT5Links} onToggle={() => setShowMT5Links(!showMT5Links)} />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#555]">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{connected ? 'Connected' : 'Connecting...'}</span>
              <span className="opacity-40 mx-1">·</span>
              <span className="tabular-nums">{filteredQuotes.length} instruments</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DesktopSearchBar value={searchQuery} onChange={setSearchQuery} />
            <button
              onClick={() => setEditMode(!editMode)}
              className={`p-2 rounded-lg transition-colors ${editMode ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-[#111] text-[#888] hover:text-white'}`}
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => setShowPicker(true)}
              className="p-2 hover:bg-[#111] rounded-lg transition-colors text-[#888] hover:text-white"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Column Headers */}
        <DesktopHeaderRow />

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="text-blue-500 animate-spin" />
            <span className="text-[#555] text-[14px]">Connecting to markets...</span>
          </div>
        )}

        {/* Desktop Quote List — embedded: natural flow, standalone: internal scroll */}
        {!isLoading && (
          <div className={embedded ? '' : 'flex-1 overflow-y-auto overscroll-contain'}>
            {filteredQuotes.map((quote, index) => (
              <div
                key={quote.symbol}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <QuoteRowDesktop data={quote} isHovered={hoveredRow === index} editMode={editMode} onRemove={removeSymbol} onTap={setChartQuote} />
              </div>
            ))}

            {filteredQuotes.length === 0 && quotes.length > 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[#444]">
                <Search size={32} className="mb-3 opacity-50" />
                <span className="text-[14px]">No instruments found</span>
                <span className="text-[12px] mt-1">Try a different search term</span>
              </div>
            )}
          </div>
        )}

        {/* Desktop Footer */}
        <div className="flex items-center justify-between px-6 py-2 bg-[#060606] border-t border-[#141414] text-[11px] text-[#444]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Server: {connected ? 'Live-MT5' : 'Reconnecting...'}</span>
            </div>
            <span className="opacity-40">|</span>
            <span className="tabular-nums">Ping: {connected ? '42ms' : '---'}</span>
          </div>
          <span className="tabular-nums">{utcTime} UTC</span>
        </div>
      </div>

      {/* Chart Modal */}
      {chartQuote && (
        <ChartModal quote={chartQuote} onClose={() => setChartQuote(null)} isDesktop={true} />
      )}

      {/* Instrument Picker Modal */}
      <InstrumentPicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        watchlist={watchlist}
        onAdd={addSymbol}
        onRemove={removeSymbol}
      />
    </div>
  );
}
