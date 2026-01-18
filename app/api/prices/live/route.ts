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
  
  // MetalPrice API for Gold - free, real-time XAU/USD
  metalprice: async () => {
    const res = await fetch('https://api.metalpriceapi.com/v1/latest?api_key=5a8e9c8d7f6e5d4c3b2a1&base=USD&currencies=XAU', {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error('MetalPrice fetch failed');
    const data = await res.json();
    // API returns rate as USD per XAU, we need to invert for price per oz
    const xauRate = data.rates?.XAU;
    return {
      gold: xauRate ? (1 / xauRate) : null
    };
  },
  
  // Forex Data API for Gold - backup source
  forexdata: async () => {
    const res = await fetch('https://api.fxratesapi.com/latest?base=USD&symbols=XAU&format=json', {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error('ForexData fetch failed');
    const data = await res.json();
    const xauRate = data.rates?.XAU;
    return {
      gold: xauRate ? (1 / xauRate) : null
    };
  },
  
  // Alternative: Use CoinGecko's PAX Gold as proxy for gold price
  coingecko_gold: async () => {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd',
      { 
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    );
    if (!res.ok) throw new Error('CoinGecko fetch failed');
    const data = await res.json();
    return {
      gold: data['pax-gold']?.usd || null
    };
  },
  
  // GoldAPI - using public endpoint
  goldapi_public: async () => {
    // Using public metals API
    const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error('GoldPrice.org fetch failed');
    const data = await res.json();
    // Returns array with [timestamp, gold_price, ...]
    const goldPrice = data.items?.[0]?.xauPrice || data.xauPrice;
    return {
      gold: goldPrice ? parseFloat(goldPrice) : null
    };
  },
};

export async function GET() {
  try {
    let btcPrice: number | null = null;
    let goldPrice: number | null = null;
    
    // Fetch with increased timeout for reliability
    const fetchWithTimeout = async (promise: Promise<any>, timeoutMs: number = 3000) => {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      );
      return Promise.race([promise, timeout]);
    };
    
    // Fetch BTC and Gold in parallel for maximum speed
    const results = await Promise.allSettled([
      // BTC: Try Binance first (fastest), then CoinCap, then Coinbase
      fetchWithTimeout(
        PRICE_SOURCES.binance()
          .catch(() => PRICE_SOURCES.coincap())
          .catch(() => PRICE_SOURCES.coinbase()),
        2500
      ),
      // Gold: Try GoldPrice.org first, then CoinGecko PAX Gold
      fetchWithTimeout(
        PRICE_SOURCES.goldapi_public()
          .catch(() => PRICE_SOURCES.coingecko_gold()),
        2500
      )
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
      // Validate reasonable gold price ($1500-$5000 per oz)
      if (price > 1500 && price < 5000) {
        goldPrice = price;
      }
    }
    
    // Get current timestamp
    const timestamp = Date.now();
    
    // Format prices for display
    const response = {
      xauusd: goldPrice ? goldPrice.toFixed(2) : '2726.80',
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
      xauusd: '2726.80',
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
