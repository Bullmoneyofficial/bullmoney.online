// app/api/breaking-news/route.ts
import { NextResponse } from "next/server";

/**
 * BREAKING NEWS AGGREGATOR
 * Pulls from Google News RSS + major financial/geopolitical sources
 * Filters for market-relevant breaking news only
 * Detects urgency level based on keywords and recency
 */

// In-memory cache
let cachedBreaking: { items: BreakingNewsItem[]; timestamp: number } | null = null;
const CACHE_TTL = 120_000; // 120 seconds — feeds don't refresh faster than this

// Background image scraping cache (link -> og:image URL)
const ogImageCache = new Map<string, string | null>();
let bgScrapeInFlight = false;

interface BreakingNewsItem {
  title: string;
  subtitle: string;
  link: string;
  source: string;
  category: string;
  image: string | null;
  published_at: string;
  urgency: "critical" | "high" | "medium" | "normal";
  age: string; // "2m ago", "1h ago"
}

// Google News RSS feeds + major financial/geopolitical sources
const BREAKING_FEEDS: { url: string; source: string; category: string; priority: number }[] = [
  // === GOOGLE NEWS - Broad coverage (top 3 only) ===
  { url: "https://news.google.com/rss/search?q=breaking+news+stock+market&hl=en&gl=US&ceid=US:en", source: "Google News", category: "markets", priority: 10 },
  { url: "https://news.google.com/rss/search?q=breaking+news+geopolitics+war+economy&hl=en&gl=US&ceid=US:en", source: "Google News", category: "geopolitics", priority: 10 },
  { url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en", source: "Google News Business", category: "markets", priority: 10 },

  // === DIRECT FINANCIAL SOURCES (top 4) ===
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC", category: "markets", priority: 9 },
  { url: "https://www.marketwatch.com/rss/topstories", source: "MarketWatch", category: "markets", priority: 8 },
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US", source: "Yahoo Finance", category: "stocks", priority: 8 },
  { url: "https://feeds.reuters.com/reuters/businessNews", source: "Reuters Business", category: "markets", priority: 9 },

  // === GEOPOLITICS (top 2) ===
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World", category: "geopolitics", priority: 8 },
  { url: "https://feeds.reuters.com/reuters/topNews", source: "Reuters", category: "geopolitics", priority: 9 },

  // === CRYPTO (1) ===
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph", category: "crypto", priority: 7 },

  // === COMMODITIES (1) ===
  { url: "https://www.kitco.com/rss/gold.xml", source: "Kitco Gold", category: "commodities", priority: 7 },
];

// Keywords that indicate urgency levels
const CRITICAL_KEYWORDS = [
  "breaking", "just in", "alert", "urgent", "flash", "emergency",
  "war", "attack", "bomb", "explosion", "missile", "invasion",
  "crash", "collapse", "plunge", "surge", "soar", "rally",
  "fed rate", "rate hike", "rate cut", "recession", "default",
  "sanctions", "nuclear", "coup", "assassination"
];

const HIGH_KEYWORDS = [
  "breaking news", "developing", "live updates", "escalation",
  "inflation", "jobs report", "gdp", "unemployment", "earnings",
  "trade war", "tariff", "ban", "restriction", "shutdown",
  "crisis", "volatility", "record high", "record low", "all-time",
  "bitcoin", "ethereum", "crypto crash", "crypto rally"
];

const MARKET_RELEVANCE_KEYWORDS = [
  "market", "stock", "share", "trading", "trader", "invest",
  "forex", "currency", "dollar", "euro", "yen", "pound",
  "bitcoin", "crypto", "ethereum", "blockchain", "defi",
  "gold", "oil", "silver", "commodity", "futures",
  "fed", "ecb", "bank of england", "central bank", "interest rate",
  "inflation", "deflation", "recession", "gdp", "employment",
  "earnings", "revenue", "profit", "ipo", "merger", "acquisition",
  "s&p", "nasdaq", "dow jones", "ftse", "nikkei", "dax",
  "war", "conflict", "sanctions", "tariff", "trade deal",
  "geopolit", "military", "nuclear", "terror", "coup",
  "energy", "opec", "pipeline", "supply chain",
  "election", "policy", "regulation", "sec", "cftc",
  "bull", "bear", "rally", "selloff", "correction",
  "hedge fund", "wall street", "treasury", "bond", "yield"
];

function isMarketRelevant(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return MARKET_RELEVANCE_KEYWORDS.some(keyword => text.includes(keyword));
}

function detectUrgency(title: string, description: string, publishedAt: string | undefined): BreakingNewsItem["urgency"] {
  const text = `${title} ${description}`.toLowerCase();
  const ageMs = publishedAt ? Date.now() - new Date(publishedAt).getTime() : Infinity;
  const isVeryRecent = ageMs < 30 * 60 * 1000; // < 30 minutes
  const isRecent = ageMs < 2 * 60 * 60 * 1000; // < 2 hours

  const hasCritical = CRITICAL_KEYWORDS.some(k => text.includes(k));
  const hasHigh = HIGH_KEYWORDS.some(k => text.includes(k));

  if (hasCritical && isVeryRecent) return "critical";
  if (hasCritical || (hasHigh && isVeryRecent)) return "high";
  if (hasHigh || isRecent) return "medium";
  return "normal";
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function extractImage(block: string): string | null {
  // Try media:content url attribute (most common in RSS)
  const mediaContent = /media:content[^>]+url=["']([^"']+)["']/i.exec(block);
  if (mediaContent?.[1] && isValidImageUrl(mediaContent[1])) return mediaContent[1];

  // Try media:thumbnail
  const mediaThumb = /media:thumbnail[^>]+url=["']([^"']+)["']/i.exec(block);
  if (mediaThumb?.[1] && isValidImageUrl(mediaThumb[1])) return mediaThumb[1];

  // Try media:group > media:content
  const mediaGroup = /<media:group[\s\S]*?<media:content[^>]+url=["']([^"']+)["']/i.exec(block);
  if (mediaGroup?.[1] && isValidImageUrl(mediaGroup[1])) return mediaGroup[1];

  // Try enclosure with image type
  const enc = /enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i.exec(block);
  if (enc?.[1] && isValidImageUrl(enc[1])) return enc[1];

  // Try enclosure without type check (often images)
  const encAny = /enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["']/i.exec(block);
  if (encAny?.[1]) return encAny[1];

  // Try img tag in description/content (common in Google News)
  const img = /<img[^>]+src=["']([^"']+)["']/i.exec(block);
  if (img?.[1] && isValidImageUrl(img[1])) return img[1];

  // Try image tag directly
  const imageTag = /<image>[\s\S]*?<url>([^<]+)<\/url>/i.exec(block);
  if (imageTag?.[1] && isValidImageUrl(imageTag[1].trim())) return imageTag[1].trim();

  // Try any https URL ending in image extension
  const anyImg = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]*)?/i.exec(block);
  if (anyImg?.[0]) return anyImg[0];

  return null;
}

function isValidImageUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  if (!url.startsWith('http')) return false;
  // Skip tiny tracking pixels and icons
  if (url.includes('1x1') || url.includes('pixel') || url.includes('tracking')) return false;
  if (url.includes('favicon') || url.includes('icon') || url.includes('logo') && url.includes('16')) return false;
  return true;
}

/** Scrape og:image from the actual article page */
async function scrapeOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;

    // Only read first 50KB to find og:image quickly
    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = '';
    const decoder = new TextDecoder();
    while (html.length < 50000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      
      // Check if we've passed the <head> section
      if (html.includes('</head>')) break;
    }
    reader.cancel();

    // Try og:image
    const ogImage = /property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)
      || /content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
    if (ogImage?.[1] && isValidImageUrl(ogImage[1])) return ogImage[1];

    // Try twitter:image
    const twImage = /name=["']twitter:image[^"']*["'][^>]+content=["']([^"']+)["']/i.exec(html)
      || /content=["']([^"']+)["'][^>]+name=["']twitter:image/i.exec(html);
    if (twImage?.[1] && isValidImageUrl(twImage[1])) return twImage[1];

    // Try meta image_src
    const metaImg = /rel=["']image_src["'][^>]+href=["']([^"']+)["']/i.exec(html);
    if (metaImg?.[1] && isValidImageUrl(metaImg[1])) return metaImg[1];

    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Return cached data if fresh
    if (cachedBreaking && Date.now() - cachedBreaking.timestamp < CACHE_TTL) {
      return NextResponse.json({
        items: cachedBreaking.items,
        cached: true,
        meta: { total: cachedBreaking.items.length, timestamp: new Date(cachedBreaking.timestamp).toISOString() }
      });
    }

    // Fetch all feeds in parallel with fast timeout
    const results = await Promise.allSettled(
      BREAKING_FEEDS.map(async (f) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        try {
          const res = await fetch(f.url, {
            cache: "no-store",
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "application/rss+xml, application/xml, text/xml, */*"
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!res.ok) return [];
          const xml = await res.text();
          return parseBreakingRss(xml, f.source, f.category, f.priority);
        } catch {
          clearTimeout(timeoutId);
          return [];
        }
      })
    );

    const allItems = results
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .filter((item) => isMarketRelevant(item.title, item.subtitle));

    // Deduplicate by title similarity
    const unique: BreakingNewsItem[] = [];
    for (const item of allItems) {
      const titleKey = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
      const isDupe = unique.some(u => {
        const existingKey = u.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
        return titleKey === existingKey || levenshteinSimilarity(titleKey, existingKey) > 0.8;
      });
      if (!isDupe) unique.push(item);
    }

    // Sort by urgency then recency
    const urgencyOrder = { critical: 0, high: 1, medium: 2, normal: 3 };
    const sorted = unique
      .sort((a, b) => {
        const urgDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        if (urgDiff !== 0) return urgDiff;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      })
      .slice(0, 50);

    // Apply any previously scraped og:images from background cache
    for (const item of sorted) {
      if (!item.image && ogImageCache.has(item.link)) {
        const cached = ogImageCache.get(item.link);
        if (cached) item.image = cached;
      }
    }

    if (sorted.length > 0) {
      cachedBreaking = { items: sorted, timestamp: Date.now() };
    }

    // Scrape og:image in the BACKGROUND — don't block the response
    const needsImage = sorted.filter(item => !item.image && !ogImageCache.has(item.link));
    if (needsImage.length > 0 && !bgScrapeInFlight) {
      bgScrapeInFlight = true;
      Promise.allSettled(
        needsImage.slice(0, 20).map(async (item) => {
          const ogImg = await scrapeOgImage(item.link);
          ogImageCache.set(item.link, ogImg);
          if (ogImg) item.image = ogImg;
        })
      ).then((results) => {
        const scraped = results.filter(r => r.status === 'fulfilled').length;
        console.log(`📰  Scraped og:image for ${scraped}/${needsImage.slice(0, 20).length} articles`);
        // Update the cache with images
        if (cachedBreaking) {
          cachedBreaking = { ...cachedBreaking, timestamp: Date.now() };
        }
      }).finally(() => { bgScrapeInFlight = false; });
    }

    if (sorted.length === 0) {
      const fallback = generateBreakingFallback();
      return NextResponse.json({ items: fallback, isFallback: true });
    }

    return NextResponse.json({
      items: sorted,
      meta: {
        total: sorted.length,
        critical: sorted.filter(i => i.urgency === "critical").length,
        high: sorted.filter(i => i.urgency === "high").length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {
    const err = e as any;
    console.error("[Breaking News API] Error:", err?.message);
    return NextResponse.json({ items: generateBreakingFallback(), error: err?.message }, { status: 200 });
  }
}

function parseBreakingRss(xml: string, fallbackSource: string, feedCategory: string, priority: number): BreakingNewsItem[] {
  const items: BreakingNewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];

  for (const block of blocks.slice(0, 12)) {
    const title = strip(pickTag(block, ["title"]) || "");
    const link = attrOf(block, "link", "href") || strip(pickTag(block, ["link"]) || pickTag(block, ["guid"]) || "");
    const pub = pickTag(block, ["pubDate", "published", "updated", "dc:date"]) || undefined;
    const rawSource = strip(pickTag(block, ["source"])) || fallbackSource;
    const description = strip(pickTag(block, ["description", "summary", "content"]) || "").substring(0, 300);
    const image = extractImage(block);

    if (!title || !link) continue;

    const publishedAt = pub ? new Date(strip(pub)).toISOString() : new Date().toISOString();
    const urgency = detectUrgency(title, description, publishedAt);

    items.push({
      title: title.substring(0, 150),
      subtitle: description.substring(0, 120) || feedCategory.charAt(0).toUpperCase() + feedCategory.slice(1),
      link: link,
      source: rawSource,
      category: feedCategory,
      image,
      published_at: publishedAt,
      urgency,
      age: getTimeAgo(publishedAt),
    });
  }

  return items;
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  
  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) { costs[j] = j; continue; }
      if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter[i - 1] !== longer[j - 1]) {
          newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }
  return (longer.length - costs[longer.length]) / longer.length;
}

function generateBreakingFallback(): BreakingNewsItem[] {
  const now = Date.now();
  return [
    { title: "Markets open mixed as investors digest economic data", subtitle: "S&P 500 futures flat ahead of key reports", link: "#", source: "Market Watch", category: "markets", image: null, published_at: new Date(now).toISOString(), urgency: "medium", age: "Just now" },
    { title: "Federal Reserve officials signal cautious policy approach", subtitle: "Rate decision expected to hold steady", link: "#", source: "CNBC", category: "economics", image: null, published_at: new Date(now - 1800000).toISOString(), urgency: "high", age: "30m ago" },
    { title: "Oil prices steady amid global supply concerns", subtitle: "OPEC+ production cuts in focus", link: "#", source: "Reuters", category: "commodities", image: null, published_at: new Date(now - 3600000).toISOString(), urgency: "medium", age: "1h ago" },
    { title: "Gold hits session high on safe-haven flows", subtitle: "Precious metals rally on uncertainty", link: "#", source: "Kitco", category: "commodities", image: null, published_at: new Date(now - 5400000).toISOString(), urgency: "normal", age: "1h ago" },
    { title: "European markets trade lower on geopolitical tensions", subtitle: "DAX and FTSE under pressure", link: "#", source: "BBC", category: "geopolitics", image: null, published_at: new Date(now - 7200000).toISOString(), urgency: "medium", age: "2h ago" },
  ];
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
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
