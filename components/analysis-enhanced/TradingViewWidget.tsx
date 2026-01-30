"use client";

import React, { useEffect, useRef, memo, useState } from 'react';
import { ShimmerSpinner } from '@/components/ui/UnifiedShimmer';

interface TradingViewWidgetProps {
  symbol: string; // e.g., "BINANCE:BTCUSDT", "FX:EURUSD", "NASDAQ:AAPL"
  interval?: string; // e.g., "1", "5", "15", "60", "D", "W"
  theme?: 'dark' | 'light';
  height?: number | string;
  autosize?: boolean;
  showToolbar?: boolean;
  showDrawingToolsbar?: boolean;
  allowSymbolChange?: boolean;
  containerClassName?: string;
}

// Convert common symbols to TradingView format
const formatSymbol = (symbol: string): string => {
  // Already formatted (has exchange prefix)
  if (symbol.includes(':')) {
    return symbol;
  }

  // Common conversions
  const upperSymbol = symbol.toUpperCase().replace('/', '');

  // Crypto pairs
  if (upperSymbol.endsWith('USD') || upperSymbol.endsWith('USDT')) {
    return `BINANCE:${upperSymbol.replace('USD', 'USDT')}`;
  }
  if (upperSymbol.endsWith('BTC')) {
    return `BINANCE:${upperSymbol}`;
  }

  // Forex pairs
  const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'XAUUSD', 'XAGUSD'];
  if (forexPairs.includes(upperSymbol)) {
    return `FX:${upperSymbol}`;
  }

  // Gold/Silver
  if (upperSymbol === 'GOLD' || upperSymbol === 'XAU') {
    return 'FX:XAUUSD';
  }
  if (upperSymbol === 'SILVER' || upperSymbol === 'XAG') {
    return 'FX:XAGUSD';
  }

  // US Stocks (default to NASDAQ)
  return `NASDAQ:${upperSymbol}`;
};

export const TradingViewWidget = memo(({
  symbol,
  interval = 'D',
  theme = 'dark',
  height = 400,
  autosize = false,
  showToolbar = true,
  showDrawingToolsbar = false,
  allowSymbolChange = false,
  containerClassName = '',
}: TradingViewWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const widgetIdRef = useRef<string>(`tradingview_${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    if (!containerRef.current) return;

    const formattedSymbol = formatSymbol(symbol);
    const container = containerRef.current;

    // Clear previous widget
    container.innerHTML = '';
    setIsLoading(true);
    setError(null);

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = widgetIdRef.current;
    widgetContainer.style.height = typeof height === 'number' ? `${height}px` : height;
    widgetContainer.style.width = '100%';
    container.appendChild(widgetContainer);

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;

    script.onload = () => {
      if (typeof (window as any).TradingView === 'undefined') {
        setError('Failed to load TradingView');
        setIsLoading(false);
        return;
      }

      try {
        new (window as any).TradingView.widget({
          container_id: widgetIdRef.current,
          symbol: formattedSymbol,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1', // Candlestick
          locale: 'en',
          toolbar_bg: theme === 'dark' ? '#1a1a1a' : '#f1f3f6',
          enable_publishing: false,
          hide_top_toolbar: !showToolbar,
          hide_legend: false,
          save_image: false,
          hide_volume: false,
          allow_symbol_change: allowSymbolChange,
          withdateranges: true,
          details: false,
          hotlist: false,
          calendar: false,
          studies: [],
          show_popup_button: false,
          popup_width: '1000',
          popup_height: '650',
          autosize: autosize,
          height: typeof height === 'number' ? height : parseInt(height) || 400,
          width: '100%',
          backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)',
          gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        });

        setIsLoading(false);
      } catch (err) {
        console.error('TradingView widget error:', err);
        setError('Failed to initialize chart');
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError('Failed to load TradingView script');
      setIsLoading(false);
    };

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="tradingview.com/tv.js"]');
    if (existingScript && typeof (window as any).TradingView !== 'undefined') {
      script.onload(new Event('load'));
    } else if (!existingScript) {
      document.head.appendChild(script);
    } else {
      // Script exists but TradingView not loaded yet, wait for it
      const checkInterval = setInterval(() => {
        if (typeof (window as any).TradingView !== 'undefined') {
          clearInterval(checkInterval);
          if (script.onload) {
            script.onload(new Event('load'));
          }
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (typeof (window as any).TradingView === 'undefined') {
          setError('TradingView loading timeout');
          setIsLoading(false);
        }
      }, 10000);
    }

    return () => {
      // Cleanup
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, height, autosize, showToolbar, allowSymbolChange]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-900 rounded-lg ${containerClassName}`}
        style={{ height: typeof height === 'number' ? height : parseInt(height) || 400 }}
      >
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <p className="text-neutral-500 text-xs">Symbol: {formatSymbol(symbol)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${containerClassName}`}>
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-10"
          style={{ height: typeof height === 'number' ? height : parseInt(height) || 400 }}
        >
          <div className="text-center">
            <ShimmerSpinner size={32} color="blue" />
            <p className="text-neutral-400 text-sm mt-3">Loading chart...</p>
            <p className="text-neutral-500 text-xs mt-1">{formatSymbol(symbol)}</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full"
        style={{
          height: typeof height === 'number' ? height : height,
          minHeight: 300,
        }}
      />
    </div>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

// Lightweight version using TradingView's mini widget
export const TradingViewMiniWidget = memo(({
  symbol,
  theme = 'dark',
}: {
  symbol: string;
  theme?: 'dark' | 'light';
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const formattedSymbol = formatSymbol(symbol);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: formattedSymbol,
      width: '100%',
      height: '100%',
      locale: 'en',
      dateRange: '1D',
      colorTheme: theme,
      isTransparent: true,
      autosize: true,
      largeChartUrl: '',
    });

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol, theme, formattedSymbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: 150, width: '100%' }}
    />
  );
});

TradingViewMiniWidget.displayName = 'TradingViewMiniWidget';

export default TradingViewWidget;
