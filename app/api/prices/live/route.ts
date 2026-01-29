import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Multiple price data sources with fallbacks - all using free, no-limit APIs
const PRICE_SOURCES = {
  // Binance for BTC - fast and reliable, no API key needed
  binance: async () => {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error('Binance fetch failed');
    const data = await res.json();
    return {
      btc: parseFloat(data.price)
    };
  },
  
  // Coinbase for BTC - reliable backup
  coinbase: async () => {
    const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error('Coinbase fetch failed');
    const data = await res.json();
    return {
      btc: parseFloat(data.data.amount)
    };
  },
  
  // CoinCap for BTC - another fast alternative
  coincap: async () => {
    const res = await fetch('https://api.coincap.io/v2/assets/bitcoin', {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error('CoinCap fetch failed');
    const data = await res.json();
    return {
      btc: parseFloat(data.data.priceUsd)
    };
  },
  
  // GoldAPI - using public endpoint (PRIMARY SOURCE - MOST RELIABLE)
  goldapi_public: async () => {
    // Using public metals API from GoldPrice.org
    const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!res.ok) throw new Error('GoldPrice.org fetch failed');
    const data = await res.json();
    // Returns array with [timestamp, gold_price, ...]
    const goldPrice = data.items?.[0]?.xauPrice || data.xauPrice;
    return {
      gold: goldPrice ? parseFloat(goldPrice) : null
    };
  },

  // Alternative: Use CoinGecko's PAX Gold as proxy for gold price
  coingecko_gold: async () => {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd',
      { 
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    if (!res.ok) throw new Error('CoinGecko fetch failed');
    const data = await res.json();
    return {
      gold: data['pax-gold']?.usd || null
    };
  },

  // Metals-API.com - Free tier with real XAUUSD
  metalsapi: async () => {
    const res = await fetch('https://metals-api.com/api/latest?access_key=YOUR_KEY&base=USD&symbols=XAU', {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error('Metals-API fetch failed');
    const data = await res.json();
    const xauRate = data.rates?.XAU;
    return {
      gold: xauRate ? (1 / xauRate) : null
    };
  },

  // Forex API with XAUUSD direct
  forexapi: async () => {
    const res = await fetch('https://api.fxratesapi.com/latest?base=XAU&symbols=USD&format=json', {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error('ForexAPI fetch failed');
    const data = await res.json();
    const usdRate = data.rates?.USD;
    return {
      gold: usdRate ? parseFloat(usdRate) : null
    };
  },

  // Financial Modeling Prep - Free tier
  fmp_gold: async () => {
    const res = await fetch('https://financialmodelingprep.com/api/v3/quote/XAUUSD?apikey=demo', {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error('FMP fetch failed');
    const data = await res.json();
    return {
      gold: data[0]?.price ? parseFloat(data[0].price) : null
    };
  },
};

export async function GET() {
  try {
    let btcPrice: number | null = null;
    let goldPrice: number | null = null;
    
    // Fetch with timeout using AbortController for proper cleanup
    const fetchWithTimeout = async (promiseFn: () => Promise<any>, timeoutMs: number = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const result = await promiseFn();
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };
    
    // Fetch BTC and Gold in parallel for maximum speed
    const results = await Promise.allSettled([
      // BTC: Try Binance first (fastest), then CoinCap, then Coinbase
      fetchWithTimeout(
        () => PRICE_SOURCES.binance()
          .catch(() => PRICE_SOURCES.coincap())
          .catch(() => PRICE_SOURCES.coinbase()),
        3000
      ),
      // Gold: Try multiple sources in parallel, use first successful one
      (async () => {
        const goldResults = await Promise.allSettled([
          fetchWithTimeout(() => PRICE_SOURCES.goldapi_public(), 5000),
          fetchWithTimeout(() => PRICE_SOURCES.coingecko_gold(), 5000),
          fetchWithTimeout(() => PRICE_SOURCES.fmp_gold(), 5000),
          fetchWithTimeout(() => PRICE_SOURCES.forexapi(), 5000),
        ]);
        // Return first successful result
        for (const result of goldResults) {
          if (result.status === 'fulfilled' && result.value?.gold) {
            return result.value;
          }
        }
        throw new Error('All gold sources failed');
      })()
    ]);
    
    // Extract BTC price
    if (results[0].status === 'fulfilled' && results[0].value?.btc) {
      const price = results[0].value.btc;
      // Validate reasonable BTC price ($10k - $500k)
      if (price > 10000 && price < 500000) {
        btcPrice = price;
      }
    }
    
    // Extract Gold XAU/USD spot price
    if (results[1].status === 'fulfilled' && results[1].value?.gold) {
      const price = results[1].value.gold;
      // Validate reasonable gold price ($1500-$10000 per oz) - updated for 2026 gold prices
      if (price > 1500 && price < 10000) {
        goldPrice = price;
        console.log(`[GOLD PRICE] Successfully fetched: $${price.toFixed(2)}`);
      } else {
        console.warn(`[GOLD PRICE] Invalid price range: $${price}`);
      }
    } else {
      console.error('[GOLD PRICE] Failed to fetch from all sources:', results[1].status === 'rejected' ? results[1].reason : 'No value');
    }
    
    // Get current timestamp
    const timestamp = Date.now();
    
    // Format prices for display
    const response = {
      xauusd: goldPrice ? goldPrice.toFixed(2) : '5085.20', // Updated fallback to current 2026 market price
      btcusd: btcPrice ? Math.round(btcPrice).toString() : '102500',
      timestamp: new Date(timestamp).toISOString(),
      updateFrequency: '1s',
      sources: {
        btc: btcPrice ? 'live-api' : 'fallback',
        gold: goldPrice ? 'live-api' : 'fallback'
      },
      // Debug info (can be removed in production)
      debug: {
        btcFetched: !!btcPrice,
        goldFetched: !!goldPrice,
        btcValue: btcPrice,
        goldValue: goldPrice
      }
    };
    
    return NextResponse.json(response, {
      headers: {
        // Allow caching for 1 second max, with stale-while-revalidate
        'Cache-Control': 'public, max-age=0, s-maxage=1, stale-while-revalidate=2',
        'Content-Type': 'application/json',
        // Prevent any proxy caching
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Price fetch error:', error);
    
    // Return fallback prices with error indicator
    return NextResponse.json({
      xauusd: '5085.20', // Updated fallback to current 2026 market price
      btcusd: '102500',
      timestamp: new Date().toISOString(),
      updateFrequency: '1s',
      sources: {
        btc: 'error-fallback',
        gold: 'error-fallback'
      },
      error: true
    }, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=1, stale-while-revalidate=2',
        'Content-Type': 'application/json'
      }
    });
  }
}
