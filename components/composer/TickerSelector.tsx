"use client";

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

// Common ticker symbols for autocomplete
const POPULAR_TICKERS = [
  // Forex
  { symbol: 'EURUSD', name: 'Euro/US Dollar', market: 'forex' },
  { symbol: 'GBPUSD', name: 'British Pound/US Dollar', market: 'forex' },
  { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen', market: 'forex' },
  { symbol: 'XAUUSD', name: 'Gold/US Dollar', market: 'forex' },
  { symbol: 'XAGUSD', name: 'Silver/US Dollar', market: 'forex' },
  // Crypto
  { symbol: 'BTC', name: 'Bitcoin', market: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', market: 'crypto' },
  { symbol: 'SOL', name: 'Solana', market: 'crypto' },
  { symbol: 'XRP', name: 'Ripple', market: 'crypto' },
  { symbol: 'BNB', name: 'Binance Coin', market: 'crypto' },
  { symbol: 'DOGE', name: 'Dogecoin', market: 'crypto' },
  // US Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'stocks' },
  { symbol: 'TSLA', name: 'Tesla Inc.', market: 'stocks' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'stocks' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'stocks' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'stocks' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'stocks' },
  { symbol: 'META', name: 'Meta Platforms Inc.', market: 'stocks' },
  // Indices
  { symbol: 'SPX', name: 'S&P 500', market: 'indices' },
  { symbol: 'NDX', name: 'Nasdaq 100', market: 'indices' },
  { symbol: 'DJI', name: 'Dow Jones Industrial', market: 'indices' },
];

const marketColors: Record<string, string> = {
  forex: 'bg-white/20 text-white',
  crypto: 'bg-orange-500/20 text-orange-400',
  stocks: 'bg-white/20 text-white',
  indices: 'bg-white/20 text-white',
};

interface TickerSelectorProps {
  selectedTickers: string[];
  onChange: (tickers: string[]) => void;
  maxTickers?: number;
}

export const TickerSelector = memo(({
  selectedTickers,
  onChange,
  maxTickers = 5,
}: TickerSelectorProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(POPULAR_TICKERS.slice(0, 6));
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const searchTickers = useDebouncedCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions(POPULAR_TICKERS.slice(0, 6));
      return;
    }

    const normalizedQuery = searchQuery.toUpperCase().replace('$', '');
    const filtered = POPULAR_TICKERS.filter(
      ticker =>
        ticker.symbol.includes(normalizedQuery) ||
        ticker.name.toUpperCase().includes(normalizedQuery)
    );
    setSuggestions(filtered.slice(0, 8));
  }, 200);

  // Handle query change
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    searchTickers(value);
  }, [searchTickers]);

  // Add ticker
  const addTicker = useCallback((symbol: string) => {
    SoundEffects.click();
    const normalizedSymbol = symbol.toUpperCase().replace('$', '');
    
    if (selectedTickers.includes(normalizedSymbol)) return;
    if (selectedTickers.length >= maxTickers) return;

    onChange([...selectedTickers, normalizedSymbol]);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, [selectedTickers, maxTickers, onChange]);

  // Remove ticker
  const removeTicker = useCallback((symbol: string) => {
    SoundEffects.click();
    onChange(selectedTickers.filter(t => t !== symbol));
  }, [selectedTickers, onChange]);

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      addTicker(query);
    } else if (e.key === 'Backspace' && !query && selectedTickers.length > 0) {
      removeTicker(selectedTickers[selectedTickers.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [query, selectedTickers, addTicker, removeTicker]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Input with selected tickers */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-black/50 border border-white/30 rounded-xl focus-within:border-white">
        {/* Selected Tickers */}
        <AnimatePresence mode="popLayout">
          {selectedTickers.map((ticker) => {
            const tickerInfo = POPULAR_TICKERS.find(t => t.symbol === ticker);
            const colorClass = tickerInfo ? marketColors[tickerInfo.market] : 'bg-neutral-700 text-neutral-300';
            
            return (
              <motion.span
                key={ticker}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${colorClass}`}
              >
                ${ticker}
                <button
                  onClick={() => removeTicker(ticker)}
                  className="ml-1 opacity-60 hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            );
          })}
        </AnimatePresence>

        {/* Input */}
        <div className="flex-1 min-w-[120px] flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTickers.length >= maxTickers ? 'Max tickers reached' : 'Add $ticker...'}
            disabled={selectedTickers.length >= maxTickers}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-neutral-500 mt-1">
        {selectedTickers.length}/{maxTickers} tickers • Press Enter to add custom ticker
      </p>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl overflow-hidden"
            style={{ zIndex: 9999 }}
          >
            {suggestions.map((ticker) => {
              const isSelected = selectedTickers.includes(ticker.symbol);
              const colorClass = marketColors[ticker.market];
              
              return (
                <motion.button
                  key={ticker.symbol}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  onClick={() => addTicker(ticker.symbol)}
                  disabled={isSelected || selectedTickers.length >= maxTickers}
                  className={`
                    w-full flex items-center gap-3 p-3 text-left transition-colors
                    ${isSelected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}
                  `}
                >
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${colorClass}`}>
                    {ticker.market}
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-medium">${ticker.symbol}</p>
                    <p className="text-xs text-neutral-500">{ticker.name}</p>
                  </div>
                  {isSelected && (
                    <span className="text-xs text-white">Added</span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

TickerSelector.displayName = 'TickerSelector';

export default TickerSelector;
