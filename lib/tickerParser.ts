// Ticker Parser - $Cashtag extraction and handling

/**
 * Regular expression to match $cashtags
 * Matches: $AAPL, $BTC, $EURUSD, $XAU (1-10 uppercase letters)
 */
const CASHTAG_REGEX = /\$([A-Z]{1,10})\b/g;

/**
 * Common tickers with their full names and types
 */
const KNOWN_TICKERS: Record<string, { name: string; type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' }> = {
  // Major Crypto
  BTC: { name: 'Bitcoin', type: 'crypto' },
  ETH: { name: 'Ethereum', type: 'crypto' },
  SOL: { name: 'Solana', type: 'crypto' },
  XRP: { name: 'Ripple', type: 'crypto' },
  ADA: { name: 'Cardano', type: 'crypto' },
  DOGE: { name: 'Dogecoin', type: 'crypto' },
  DOT: { name: 'Polkadot', type: 'crypto' },
  LINK: { name: 'Chainlink', type: 'crypto' },
  AVAX: { name: 'Avalanche', type: 'crypto' },
  MATIC: { name: 'Polygon', type: 'crypto' },

  // Major US Stocks
  AAPL: { name: 'Apple Inc.', type: 'stock' },
  MSFT: { name: 'Microsoft', type: 'stock' },
  GOOGL: { name: 'Alphabet (Google)', type: 'stock' },
  AMZN: { name: 'Amazon', type: 'stock' },
  TSLA: { name: 'Tesla', type: 'stock' },
  NVDA: { name: 'NVIDIA', type: 'stock' },
  META: { name: 'Meta Platforms', type: 'stock' },
  NFLX: { name: 'Netflix', type: 'stock' },
  AMD: { name: 'AMD', type: 'stock' },
  INTC: { name: 'Intel', type: 'stock' },
  JPM: { name: 'JPMorgan Chase', type: 'stock' },
  BAC: { name: 'Bank of America', type: 'stock' },
  WMT: { name: 'Walmart', type: 'stock' },
  DIS: { name: 'Disney', type: 'stock' },
  V: { name: 'Visa', type: 'stock' },
  MA: { name: 'Mastercard', type: 'stock' },

  // Forex Pairs
  EURUSD: { name: 'Euro/US Dollar', type: 'forex' },
  GBPUSD: { name: 'British Pound/US Dollar', type: 'forex' },
  USDJPY: { name: 'US Dollar/Japanese Yen', type: 'forex' },
  AUDUSD: { name: 'Australian Dollar/US Dollar', type: 'forex' },
  USDCAD: { name: 'US Dollar/Canadian Dollar', type: 'forex' },
  NZDUSD: { name: 'New Zealand Dollar/US Dollar', type: 'forex' },
  USDCHF: { name: 'US Dollar/Swiss Franc', type: 'forex' },
  EURGBP: { name: 'Euro/British Pound', type: 'forex' },
  EURJPY: { name: 'Euro/Japanese Yen', type: 'forex' },
  GBPJPY: { name: 'British Pound/Japanese Yen', type: 'forex' },

  // Commodities
  XAU: { name: 'Gold', type: 'commodity' },
  XAUUSD: { name: 'Gold/US Dollar', type: 'commodity' },
  XAG: { name: 'Silver', type: 'commodity' },
  XAGUSD: { name: 'Silver/US Dollar', type: 'commodity' },
  CL: { name: 'Crude Oil', type: 'commodity' },
  NG: { name: 'Natural Gas', type: 'commodity' },

  // Indices
  SPX: { name: 'S&P 500', type: 'index' },
  DJI: { name: 'Dow Jones Industrial', type: 'index' },
  NDX: { name: 'Nasdaq 100', type: 'index' },
  VIX: { name: 'Volatility Index', type: 'index' },
  DXY: { name: 'US Dollar Index', type: 'index' },
};

export interface TickerInfo {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'unknown';
}

/**
 * Extract all $cashtags from text
 */
export function extractTickers(text: string): string[] {
  const matches = text.match(CASHTAG_REGEX);
  if (!matches) return [];

  // Remove $ prefix and deduplicate
  const tickers = [...new Set(matches.map((m) => m.slice(1).toUpperCase()))];
  return tickers;
}

/**
 * Get info about a ticker symbol
 */
export function getTickerInfo(symbol: string): TickerInfo {
  const upperSymbol = symbol.toUpperCase();
  const known = KNOWN_TICKERS[upperSymbol];

  if (known) {
    return {
      symbol: upperSymbol,
      name: known.name,
      type: known.type,
    };
  }

  return {
    symbol: upperSymbol,
    name: upperSymbol,
    type: 'unknown',
  };
}

/**
 * Get suggestions for autocomplete
 */
export function getTickerSuggestions(query: string, limit: number = 10): TickerInfo[] {
  if (!query) return [];

  const upperQuery = query.toUpperCase();

  const matches: TickerInfo[] = [];

  for (const [symbol, info] of Object.entries(KNOWN_TICKERS)) {
    // Match by symbol or name
    if (symbol.includes(upperQuery) || info.name.toUpperCase().includes(upperQuery)) {
      matches.push({
        symbol,
        name: info.name,
        type: info.type,
      });
    }

    if (matches.length >= limit) break;
  }

  // Sort by relevance (exact match first, then starts with, then contains)
  return matches.sort((a, b) => {
    const aExact = a.symbol === upperQuery ? 0 : 1;
    const bExact = b.symbol === upperQuery ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;

    const aStarts = a.symbol.startsWith(upperQuery) ? 0 : 1;
    const bStarts = b.symbol.startsWith(upperQuery) ? 0 : 1;
    return aStarts - bStarts;
  });
}

/**
 * Render text with clickable $cashtags
 * Returns HTML string with $TICKER wrapped in spans
 */
export function renderCashtagsAsHtml(
  text: string,
  linkClassName: string = 'text-white hover:text-white/80 cursor-pointer'
): string {
  return text.replace(
    CASHTAG_REGEX,
    `<span class="${linkClassName}" data-ticker="$1">$$1</span>`
  );
}

/**
 * Split text into segments of plain text and tickers
 */
export interface TextSegment {
  type: 'text' | 'ticker';
  content: string;
}

export function parseTextWithTickers(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  const regex = /\$([A-Z]{1,10})\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the ticker
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add the ticker
    segments.push({
      type: 'ticker',
      content: match[1], // Without the $
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Format a ticker for display with $ prefix
 */
export function formatTicker(symbol: string): string {
  return `$${symbol.toUpperCase()}`;
}

/**
 * Validate if a string is a valid ticker format
 */
export function isValidTicker(symbol: string): boolean {
  return /^[A-Z]{1,10}$/.test(symbol.toUpperCase());
}

/**
 * Get ticker type color for UI
 */
export function getTickerTypeColor(type: TickerInfo['type']): string {
  switch (type) {
    case 'crypto':
      return 'text-white';
    case 'stock':
      return 'text-white';
    case 'forex':
      return 'text-white';
    case 'commodity':
      return 'text-white';
    case 'index':
      return 'text-white';
    default:
      return 'text-neutral-400';
  }
}
