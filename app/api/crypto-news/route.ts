// app/api/crypto-news/route.ts
import { NextResponse } from "next/server";

/**
 * FAST NEWS AGGREGATOR - Optimized for speed
 * Only verified working RSS feeds with fast response times
 * Timeout: 3 seconds per feed (fail fast)
 * Caching: In-memory cache for 60 seconds
 */

// In-memory cache
let cachedNews: { items: any[]; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

// VERIFIED WORKING FEEDS - Tested and confirmed to work
const FEEDS: { url: string; source: string; category: string }[] = [
  // === CRYPTO (Fast & Reliable) ===
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph", category: "crypto" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk", category: "crypto" },
  { url: "https://decrypt.co/feed", source: "Decrypt", category: "crypto" },
  { url: "https://u.today/rss", source: "U.Today", category: "crypto" },
  { url: "https://beincrypto.com/feed/", source: "BeInCrypto", category: "crypto" },
  { url: "https://cryptopotato.com/feed/", source: "CryptoPotato", category: "crypto" },
  
  // === FOREX (Free Sources) ===
  { url: "https://www.forexlive.com/feed/news", source: "ForexLive", category: "forex" },
  { url: "https://www.dailyfx.com/feeds/market-news", source: "DailyFX", category: "forex" },
  { url: "https://www.investing.com/rss/news.rss", source: "Investing.com", category: "forex" },
  { url: "https://www.fxstreet.com/rss/", source: "FXStreet", category: "forex" },
  
  // === STOCKS (Verified) ===
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US", source: "Yahoo Finance", category: "stocks" },
  { url: "https://seekingalpha.com/market_currents.xml", source: "Seeking Alpha", category: "stocks" },
  { url: "https://www.fool.com/feeds/index.aspx", source: "Motley Fool", category: "stocks" },
  { url: "https://www.marketwatch.com/rss/", source: "MarketWatch", category: "stocks" },
  
  // === METALS & COMMODITIES ===
  { url: "https://www.kitco.com/rss/gold.xml", source: "Kitco Gold", category: "metals" },
  { url: "https://oilprice.com/rss/main", source: "OilPrice", category: "metals" },
  
  // === WORLD/GEOPOLITICS ===
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World", category: "geopolitics" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", source: "NY Times", category: "geopolitics" },
  { url: "https://www.theguardian.com/world/rss", source: "The Guardian", category: "geopolitics" },
  
  // === MARKETS/ECONOMICS ===
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC", category: "markets" },
  
  // === TECH ===
  { url: "https://techcrunch.com/feed/", source: "TechCrunch", category: "tech" },
  { url: "https://www.theverge.com/rss/index.xml", source: "The Verge", category: "tech" },
];

export async function GET() {
  try {
    // Return cached data if fresh
    if (cachedNews && Date.now() - cachedNews.timestamp < CACHE_TTL) {
      console.log("[News API] Returning cached data");
      return NextResponse.json({ 
        items: cachedNews.items,
        cached: true,
        meta: { total: cachedNews.items.length, timestamp: new Date(cachedNews.timestamp).toISOString() }
      });
    }

    // Fetch all feeds in parallel with FAST timeout (3 seconds)
    const results = await Promise.allSettled(
      FEEDS.map(async (f) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout - fail fast!
        
        try {
          const res = await fetch(f.url, {
            cache: "no-store",
            headers: { 
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
              "Accept": "application/rss+xml, application/xml, text/xml, */*"
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (!res.ok) return [];
          const xml = await res.text();
          return parseRss(xml, f.source, f.category);
        } catch {
          clearTimeout(timeoutId);
          return [];
        }
      })
    );

    const successCount = results.filter(r => r.status === "fulfilled" && (r.value as any[]).length > 0).length;
    console.log(`[News API] Fetched ${successCount}/${FEEDS.length} feeds successfully`);

    // Flatten and process
    const items = results
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .filter((item, index, self) => 
        index === self.findIndex((t) => 
          t.title.toLowerCase().substring(0, 40) === item.title.toLowerCase().substring(0, 40)
        )
      )
      .sort((a, b) => {
        const ta = a.published_at ? Date.parse(a.published_at) : 0;
        const tb = b.published_at ? Date.parse(b.published_at) : 0;
        return tb - ta;
      })
      .slice(0, 100);

    // If we got items, cache them
    if (items.length > 0) {
      cachedNews = { items, timestamp: Date.now() };
    }

    // If no items, return fallback
    if (items.length === 0) {
      const fallback = generateFallbackNews();
      return NextResponse.json({ items: fallback, isFallback: true });
    }

    return NextResponse.json({ 
      items,
      meta: { total: items.length, sources: successCount, timestamp: new Date().toISOString() }
    });
  } catch (e: any) {
    console.error("[News API] Error:", e?.message);
    return NextResponse.json({ items: generateFallbackNews(), error: e?.message }, { status: 200 });
  }
}

function generateFallbackNews() {
  const now = Date.now();
  return [
    { title: "Bitcoin holds steady amid market volatility", link: "#", source: "Crypto News", category: "crypto", published_at: new Date(now).toISOString() },
    { title: "S&P 500 futures point to mixed open", link: "#", source: "Stock News", category: "stocks", published_at: new Date(now - 1800000).toISOString() },
    { title: "Gold prices surge on safe-haven demand", link: "#", source: "Commodities", category: "metals", published_at: new Date(now - 3600000).toISOString() },
    { title: "EUR/USD trades near key resistance", link: "#", source: "Forex", category: "forex", published_at: new Date(now - 5400000).toISOString() },
    { title: "Oil prices steady amid geopolitical tensions", link: "#", source: "Energy", category: "metals", published_at: new Date(now - 7200000).toISOString() },
    { title: "Tech stocks rally on AI optimism", link: "#", source: "Tech Markets", category: "tech", published_at: new Date(now - 9000000).toISOString() },
    { title: "Federal Reserve signals cautious approach", link: "#", source: "Economics", category: "economics", published_at: new Date(now - 10800000).toISOString() },
    { title: "Ethereum network activity hits new highs", link: "#", source: "Blockchain", category: "crypto", published_at: new Date(now - 12600000).toISOString() },
    { title: "Asian markets close mixed on trade concerns", link: "#", source: "Global Markets", category: "markets", published_at: new Date(now - 14400000).toISOString() },
    { title: "Silver outperforms as industrial demand rises", link: "#", source: "Metals Report", category: "metals", published_at: new Date(now - 16200000).toISOString() },
  ];
}

function parseRss(xml: string, fallbackSource: string, feedCategory: string) {
  const items: Array<{ 
    title: string; 
    link: string; 
    source: string; 
    category: string;
    published_at?: string;
    description?: string;
  }> = [];

  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];

  for (const block of itemBlocks.slice(0, 15)) { // Limit items per feed
    const title = pickTag(block, ["title"]) || "";
    const link = attrOf(block, "link", "href") || pickTag(block, ["link"]) || pickTag(block, ["guid"]) || "";
    const pub = pickTag(block, ["pubDate", "published", "updated", "dc:date"]) || undefined;
    const source = strip(pickTag(block, ["source"])) || fallbackSource;
    const description = strip(pickTag(block, ["description", "summary"]) || "").substring(0, 200);

    if (!title || !link) continue;

    items.push({
      title: strip(title),
      link: strip(link),
      source,
      category: feedCategory,
      published_at: pub ? new Date(strip(pub)).toISOString() : undefined,
      description: description || undefined,
    });
  }

  return items;
}

function pickTag(xml: string, names: string[]) {
  for (const n of names) {
    const cdata = new RegExp(`<${n}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${n}>`, "i").exec(xml);
    if (cdata?.[1]) return cdata[1];
    const plain = new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`, "i").exec(xml);
    if (plain?.[1]) return plain[1];
  }
  return "";
}

function attrOf(xml: string, tag: string, attr: string) {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, "i");
  return re.exec(xml)?.[1] ?? "";
}

function strip(s: string) {
  return s
    .replace(/<[^>]+>/g, "")
    // decode common entities (handle double-encoded text like &amp;#39;)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;|&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    // decode numeric entities
    .replace(/&#(\d+);/g, (_m, dec) => {
      const codePoint = Number.parseInt(String(dec), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      const codePoint = Number.parseInt(String(hex), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}
