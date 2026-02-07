'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Instrument,
  INSTRUMENT_MAP,
  DEFAULT_WATCHLIST,
  ALL_INSTRUMENTS,
} from './instruments';

// Mobile detection helper
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
         ('ontouchstart' in window && window.innerWidth < 1024);
};

// ─── Types ──────────────────────────────────────────────────
export interface LiveQuote {
  symbol: string;
  suffix: string;
  bid: number;
  ask: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  spread: number;
  volume: string;
  time: string;
  digits: number;
  pipette: boolean;
  color: 'blue' | 'red';
  category: string;
  tickDirection: 'up' | 'down' | 'none';
  lastTick: number;
  displayName: string;
}

// ─── Constants ──────────────────────────────────────────────
const WATCHLIST_KEY = 'mt5-watchlist';
const FOREX_POLL_MS_DESKTOP = 5_000;
const FOREX_POLL_MS_MOBILE = 8_000; // Slower on mobile to save battery
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';

// ─── Helpers ────────────────────────────────────────────────
function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

function spreadInPips(bid: number, ask: number, digits: number): number {
  const diff = Math.abs(ask - bid);
  const multiplier = Math.pow(10, digits);
  return Math.round(diff * multiplier);
}

function nowUTC(): string {
  const d = new Date();
  return d.toISOString().slice(11, 19);
}

// ─── Binance 24hr ticker shape ──────────────────────────────
interface BinanceTicker {
  s: string;  // Symbol
  b: string;  // Best bid
  a: string;  // Best ask
  o: string;  // Open
  h: string;  // High
  l: string;  // Low
  c: string;  // Last price
  v: string;  // Volume (base)
  p: string;  // Price change
  P: string;  // Price change %
}

// ─── Main Hook ──────────────────────────────────────────────
export function useLiveQuotes() {
  const [quotes, setQuotes] = useState<Map<string, LiveQuote>>(new Map());
  const [watchlist, setWatchlistState] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const prevPrices = useRef<Map<string, number>>(new Map());
  const forexTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const isMobile = useRef(isMobileDevice());
  const pollInterval = isMobile.current ? FOREX_POLL_MS_MOBILE : FOREX_POLL_MS_DESKTOP;

  // ── Load watchlist from localStorage ─────────────────────
  useEffect(() => {
    mountedRef.current = true;
    let saved: string[] | null = null;
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {}
    const initial = saved && saved.length > 0 ? saved : DEFAULT_WATCHLIST;
    setWatchlistState(initial);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Visibility observer for performance ───────────────────
  useEffect(() => {
    if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    
    // Use document visibility API as a simple check
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ── Persist watchlist ────────────────────────────────────
  const setWatchlist = useCallback((newList: string[]) => {
    setWatchlistState(newList);
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
    } catch {}
  }, []);

  const addSymbol = useCallback(
    (symbol: string) => {
      setWatchlistState((prev: string[]) => {
        if (prev.includes(symbol)) return prev;
        const next = [...prev, symbol];
        try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    []
  );

  const removeSymbol = useCallback(
    (symbol: string) => {
      setWatchlistState((prev: string[]) => {
        const next = prev.filter((s: string) => s !== symbol);
        try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    []
  );

  const reorderWatchlist = useCallback(
    (newOrder: string[]) => {
      setWatchlistState(newOrder);
      try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newOrder)); } catch {}
    },
    []
  );

  // ── Resolve instruments from watchlist ───────────────────
  const resolvedInstruments = watchlist
    .map((sym) => INSTRUMENT_MAP.get(sym))
    .filter(Boolean) as Instrument[];

  const cryptoInstruments = resolvedInstruments.filter((i) => i.type === 'crypto');
  const nonCryptoInstruments = resolvedInstruments.filter((i) => i.type !== 'crypto');

  // ── Update a quote ───────────────────────────────────────
  const updateQuote = useCallback(
    (
      instrument: Instrument,
      bid: number,
      ask: number,
      open: number,
      high: number,
      low: number,
      volume: number,
      priceChange: number,
      changePct: number
    ) => {
      if (!mountedRef.current) return;
      const prev = prevPrices.current.get(instrument.symbol) ?? bid;
      const dir: 'up' | 'down' | 'none' =
        bid > prev ? 'up' : bid < prev ? 'down' : 'none';
      prevPrices.current.set(instrument.symbol, bid);

      const lq: LiveQuote = {
        symbol: instrument.symbol,
        suffix: instrument.suffix,
        bid,
        ask,
        open,
        high,
        low,
        change: priceChange,
        changePercent: changePct,
        spread: spreadInPips(bid, ask, instrument.digits),
        volume: formatVolume(volume),
        time: nowUTC(),
        digits: instrument.digits,
        pipette: instrument.pipette,
        color: dir !== 'none' ? (dir === 'up' ? 'blue' : 'red') : (changePct >= 0 ? 'blue' : 'red'),
        category: instrument.category,
        tickDirection: dir,
        lastTick: Date.now(),
        displayName: instrument.displayName,
      };

      setQuotes((prev) => {
        const next = new Map(prev);
        next.set(instrument.symbol, lq);
        return next;
      });
    },
    []
  );

  // ══════════════════════════════════════════════════════════
  // BINANCE WEBSOCKET — Real-time crypto
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (cryptoInstruments.length === 0 || !isVisible) return;

    // Build lookup: binanceSymbol → Instrument
    const binanceLookup = new Map<string, Instrument>();
    cryptoInstruments.forEach((i) => {
      if (i.binanceSymbol) binanceLookup.set(i.binanceSymbol.toLowerCase(), i);
    });

    const streams = cryptoInstruments
      .filter((i) => i.binanceSymbol)
      .map((i) => `${i.binanceSymbol!.toLowerCase()}@ticker`)
      .join('/');

    const connect = () => {
      if (!mountedRef.current) return;
      const ws = new WebSocket(`${BINANCE_WS_URL}?streams=${streams}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const d: BinanceTicker = msg.data;
          if (!d || !d.s) return;
          const instrument = binanceLookup.get(d.s.toLowerCase());
          if (!instrument) return;

          const bid = parseFloat(d.b);
          const ask = parseFloat(d.a);
          const open = parseFloat(d.o);
          const high = parseFloat(d.h);
          const low = parseFloat(d.l);
          const vol = parseFloat(d.v);
          const change = parseFloat(d.p);
          const changePct = parseFloat(d.P);

          if (isNaN(bid) || bid <= 0) return;

          updateQuote(instrument, bid, ask, open, high, low, vol, change, changePct);
        } catch {}
      };

      ws.onerror = () => {
        if (mountedRef.current) setConnected(false);
      };

      ws.onclose = () => {
        if (mountedRef.current && isVisible) {
          setConnected(false);
          // Reconnect after 3s on desktop, 5s on mobile to save battery
          const delay = isMobile.current ? 5000 : 3000;
          reconnectTimerRef.current = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on cleanup
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
    // Re-connect when crypto watchlist changes or visibility changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptoInstruments.map((i) => i.symbol).join(','), isVisible]);

  // ══════════════════════════════════════════════════════════
  // FOREX & METALS — Poll API route
  // ══════════════════════════════════════════════════════════
  const fetchForexMetals = useCallback(async () => {
    if (nonCryptoInstruments.length === 0) return;
    try {
      const symbols = nonCryptoInstruments.map((i) => i.symbol).join(',');
      const res = await fetch(`/api/live-quotes?symbols=${symbols}`);
      if (!res.ok) return;
      const data: Record<
        string,
        {
          bid: number;
          ask: number;
          open: number;
          high: number;
          low: number;
          volume: number;
          change: number;
          changePercent: number;
        }
      > = await res.json();

      Object.entries(data).forEach(([sym, q]) => {
        const instrument = INSTRUMENT_MAP.get(sym);
        if (!instrument || !q) return;
        updateQuote(
          instrument,
          q.bid,
          q.ask,
          q.open,
          q.high,
          q.low,
          q.volume,
          q.change,
          q.changePercent
        );
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonCryptoInstruments.map((i) => i.symbol).join(','), updateQuote]);

  useEffect(() => {
    if (nonCryptoInstruments.length === 0 || !isVisible) return;
    fetchForexMetals();
    forexTimerRef.current = setInterval(fetchForexMetals, pollInterval);
    return () => {
      if (forexTimerRef.current) clearInterval(forexTimerRef.current);
    };
  }, [fetchForexMetals, nonCryptoInstruments.length, pollInterval, isVisible]);

  // ── Build ordered array from watchlist ───────────────────
  const orderedQuotes: LiveQuote[] = watchlist
    .map((sym) => quotes.get(sym))
    .filter(Boolean) as LiveQuote[];

  return {
    quotes: orderedQuotes,
    watchlist,
    addSymbol,
    removeSymbol,
    reorderWatchlist,
    connected,
    allInstruments: ALL_INSTRUMENTS,
  };
}
